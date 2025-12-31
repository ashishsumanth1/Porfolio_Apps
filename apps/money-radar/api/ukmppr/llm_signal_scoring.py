from __future__ import annotations

import json
import logging
import re
from typing import Any

from pydantic import BaseModel, Field, ValidationError

from ukmppr.llm_extraction import call_llm
from ukmppr.signal_scoring import SignalResult, score_from_flags, score_text

logger = logging.getLogger(__name__)


SIGNAL_PROMPT = """You are classifying a UK personal finance Reddit post/comment for pain-point signals.

TEXT:
{text}

Respond with ONLY valid JSON in this exact format:
{{
  "is_question": true/false,
  "asks_recommendation": true/false,
  "mentions_cost": true/false,
  "mentions_platform": true/false,
  "signal_score": 0.0 to 1.0,
  "detected_keywords": ["short", "keywords"]
}}

Rules:
- is_question: direct or implied question/seeking advice
- asks_recommendation: asks for product/bank/broker/app recommendation or comparison
- mentions_cost: mentions fees, interest rates, APR, prices, or costs
- mentions_platform: names a bank/platform/broker/app/product
- signal_score: higher for multiple signals (0.7+ for question+recommendation, ~0.5 for one strong signal)

JSON response:"""


class LLMSignalResponse(BaseModel):
    is_question: bool
    asks_recommendation: bool
    mentions_cost: bool
    mentions_platform: bool
    signal_score: float = Field(ge=0.0, le=1.0)
    detected_keywords: list[str] = Field(default_factory=list)


def _extract_json(response: str) -> dict[str, Any] | None:
    if not response:
        return None

    cleaned = response.strip()
    cleaned = re.sub(r"```(?:json)?", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace("```", "")

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in {"true", "yes", "y", "1"}
    return False


def _keywords_from_flags(
    *, is_question: bool, asks_recommendation: bool, mentions_cost: bool, mentions_platform: bool
) -> list[str]:
    detected: list[str] = []
    if is_question:
        detected.append("question")
    if asks_recommendation:
        detected.append("recommendation")
    if mentions_cost:
        detected.append("cost")
    if mentions_platform:
        detected.append("platform")
    return detected


def _normalize_payload(data: dict[str, Any]) -> dict[str, Any]:
    is_question = _coerce_bool(data.get("is_question"))
    asks_recommendation = _coerce_bool(data.get("asks_recommendation"))
    mentions_cost = _coerce_bool(data.get("mentions_cost"))
    mentions_platform = _coerce_bool(data.get("mentions_platform"))

    keywords = data.get("detected_keywords", [])
    if isinstance(keywords, str):
        keywords = [k.strip() for k in re.split(r"[,\n]", keywords) if k.strip()]
    elif not isinstance(keywords, list):
        keywords = []
    keywords = [str(k) for k in keywords if k]

    computed_score = score_from_flags(
        is_question=is_question,
        asks_recommendation=asks_recommendation,
        mentions_cost=mentions_cost,
        mentions_platform=mentions_platform,
    )

    signal_score = data.get("signal_score")
    try:
        signal_score = float(signal_score)
    except (TypeError, ValueError):
        signal_score = computed_score

    if signal_score < 0 or signal_score > 1:
        signal_score = computed_score

    if not keywords:
        keywords = _keywords_from_flags(
            is_question=is_question,
            asks_recommendation=asks_recommendation,
            mentions_cost=mentions_cost,
            mentions_platform=mentions_platform,
        )

    return {
        "is_question": is_question,
        "asks_recommendation": asks_recommendation,
        "mentions_cost": mentions_cost,
        "mentions_platform": mentions_platform,
        "signal_score": signal_score,
        "detected_keywords": keywords,
    }


def parse_llm_signal_response(response: str) -> SignalResult | None:
    payload = _extract_json(response)
    if not payload:
        return None

    normalized = _normalize_payload(payload)
    try:
        parsed = LLMSignalResponse(**normalized)
    except ValidationError as exc:
        logger.debug("LLM signal response validation failed: %s", exc)
        return None

    return SignalResult(
        is_question=parsed.is_question,
        asks_recommendation=parsed.asks_recommendation,
        mentions_cost=parsed.mentions_cost,
        mentions_platform=parsed.mentions_platform,
        signal_score=parsed.signal_score,
        detected_keywords=parsed.detected_keywords,
    )


def score_text_llm(text: str | None, *, max_chars: int = 1000) -> SignalResult:
    if not text or not text.strip():
        return score_text(text)

    snippet = text.strip()
    if len(snippet) > max_chars:
        snippet = snippet[:max_chars] + "..."

    response = call_llm(SIGNAL_PROMPT.format(text=snippet))
    parsed = parse_llm_signal_response(response or "")
    if parsed:
        return parsed

    logger.debug("Falling back to rule-based signal scoring.")
    return score_text(text)
