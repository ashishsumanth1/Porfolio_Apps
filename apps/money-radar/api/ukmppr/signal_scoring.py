from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class SignalResult:
    is_question: bool
    asks_recommendation: bool
    mentions_cost: bool
    mentions_platform: bool
    signal_score: float
    detected_keywords: list[str]


_RECOMMEND_PAT = re.compile(
    r"\b(anyone recommend|recommendations?|what (?:should|shall) i (?:do|use)|best (?:platform|broker|bank|card)|which (?:bank|card|platform|broker)|worth it)\b",
    re.IGNORECASE,
)
_COST_PAT = re.compile(
    r"(£\s?\d+|\b\d+(?:\.\d+)?%\b|\bapr\b|\binterest\b|\bfees?\b|\bcosts?\b)", re.IGNORECASE
)
_PLATFORM_PAT = re.compile(
    r"\b(trading\s*212|vanguard|hl|hargreaves|freetrade|aj\s*bell|ii\b|interactive\s*investor|monzo|starling|revolut|barclays|lloyds|natwest|hsbc|amex|american\s*express)\b",
    re.IGNORECASE,
)


def score_text(text: str | None) -> SignalResult:
    if not text:
        return SignalResult(
            is_question=False,
            asks_recommendation=False,
            mentions_cost=False,
            mentions_platform=False,
            signal_score=0.0,
            detected_keywords=[],
        )

    norm = text.strip()

    is_question = "?" in norm or bool(
        re.search(r"\b(how|what|why|which|can i|should i)\b", norm, re.IGNORECASE)
    )
    asks_recommendation = bool(_RECOMMEND_PAT.search(norm))
    mentions_cost = bool(_COST_PAT.search(norm))
    mentions_platform = bool(_PLATFORM_PAT.search(norm))

    detected: list[str] = []
    if is_question:
        detected.append("question")
    if asks_recommendation:
        detected.append("recommendation")
    if mentions_cost:
        detected.append("cost")
    if mentions_platform:
        detected.append("platform")

    # Simple additive score: keeps ordering stable and understandable.
    score = 0.0
    score += 0.35 if is_question else 0.0
    score += 0.35 if asks_recommendation else 0.0
    score += 0.2 if mentions_cost else 0.0
    score += 0.2 if mentions_platform else 0.0

    # Cap to [0, 1]
    score = min(1.0, score)

    return SignalResult(
        is_question=is_question,
        asks_recommendation=asks_recommendation,
        mentions_cost=mentions_cost,
        mentions_platform=mentions_platform,
        signal_score=score,
        detected_keywords=detected,
    )
