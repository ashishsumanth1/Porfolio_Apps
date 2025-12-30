"""
LLM-based extraction using Groq API (free) or local Ollama models.
Extracts UKPF stage, intent type, pain points, and buying intent from posts/comments.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from enum import Enum

import httpx
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import text
from sqlalchemy.engine import Engine

from ukmppr.settings import settings

logger = logging.getLogger(__name__)


# UKPF stages from the spec
class UKPFStage(str, Enum):
    BUDGETING = "budgeting"
    EMERGENCY_FUND = "emergency_fund"
    DEBT = "debt"
    PENSION = "pension"
    ISA = "isa"
    INVESTING = "investing"
    MORTGAGE = "mortgage"
    CREDIT = "credit"
    OTHER = "other"


class IntentType(str, Enum):
    QUESTION = "question"
    RANT = "rant"
    RECOMMENDATION_REQUEST = "recommendation_request"
    COMPARISON = "comparison"
    SUCCESS_STORY = "success_story"
    WARNING_STORY = "warning_story"
    GENERAL = "general"


class ExtractionResult(BaseModel):
    """Structured output from LLM extraction."""

    ukpf_stage: UKPFStage = Field(description="Financial life stage")
    intent_type: IntentType = Field(description="Type of intent in the content")
    pain_point: str = Field(
        description="One sentence summary of the financial pain point", max_length=200
    )
    buying_intent_score: float = Field(
        ge=0.0, le=1.0, description="How likely user wants to buy/switch products"
    )
    products_mentioned: list[str] = Field(
        default_factory=list, description="Financial products/platforms mentioned"
    )


@dataclass(frozen=True)
class ExtractionStats:
    processed: int
    successful: int
    failed: int


EXTRACTION_PROMPT = """You are a UK personal finance analyst. Analyze this Reddit post/comment and extract structured information.

TEXT:
{text}

Respond with ONLY valid JSON in this exact format:
{{
  "ukpf_stage": "one of: budgeting, emergency_fund, debt, pension, isa, investing, mortgage, credit, other",
  "intent_type": "one of: question, rant, recommendation_request, comparison, success_story, warning_story, general",
  "pain_point": "one sentence describing the financial problem or concern (max 150 chars)",
  "buying_intent_score": 0.0 to 1.0 (how likely they want to buy/switch financial products),
  "products_mentioned": ["list", "of", "platforms", "or", "products"]
}}

IMPORTANT:
- pain_point must be a single sentence under 150 characters
- buying_intent_score: 0.8+ for explicit "what should I use/buy", 0.5-0.8 for comparisons, 0.0-0.3 for general discussion
- products_mentioned: include banks (Monzo, Starling), platforms (Vanguard, T212), products (LISA, SIPP, ISA)
- If content isn't about finance, use stage="other" and intent_type="general"

JSON response:"""


def call_groq(prompt: str, model: str | None = None, timeout: float = 30.0, max_retries: int = 5) -> str | None:
    """Call Groq API (free tier - 14,400 requests/day) with rate limit handling."""
    import time
    
    model = model or settings.groq_model
    
    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY not set - falling back to Ollama")
        return call_ollama(prompt, settings.ollama_model, timeout)
    
    for attempt in range(max_retries):
        try:
            response = httpx.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 300,
                },
                timeout=timeout,
            )
            
            # Handle rate limiting (429)
            if response.status_code == 429:
                # Get retry-after header or use exponential backoff
                retry_after = response.headers.get("retry-after")
                if retry_after:
                    wait_time = float(retry_after)
                else:
                    wait_time = min(2 ** attempt * 2, 60)  # 2, 4, 8, 16, 32 seconds (max 60)
                
                logger.info(f"Rate limited. Waiting {wait_time:.1f}s before retry {attempt + 1}/{max_retries}")
                time.sleep(wait_time)
                continue
            
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                wait_time = min(2 ** attempt * 2, 60)
                logger.info(f"Rate limited. Waiting {wait_time:.1f}s before retry {attempt + 1}/{max_retries}")
                time.sleep(wait_time)
                continue
            logger.warning(f"Groq call failed: {e}")
            return None
        except Exception as e:
            logger.warning(f"Groq call failed: {e}")
            return None
    
    logger.warning(f"Max retries ({max_retries}) exceeded for Groq API")
    return None


def call_ollama(prompt: str, model: str = "llama3.2:1b", timeout: float = 30.0) -> str | None:
    """Call local Ollama API."""
    try:
        response = httpx.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Low temp for consistent structured output
                    "num_predict": 300,
                },
            },
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        logger.warning(f"Ollama call failed: {e}")
        return None


def call_llm(prompt: str, timeout: float = 30.0) -> str | None:
    """Call LLM using configured provider (Groq or Ollama)."""
    if settings.llm_provider == "groq":
        return call_groq(prompt, timeout=timeout)
    else:
        return call_ollama(prompt, model=settings.ollama_model, timeout=timeout)


def parse_llm_response(response: str) -> ExtractionResult | None:
    """Parse LLM response into structured result."""
    if not response:
        return None

    # Try to extract JSON from response
    try:
        # Find JSON object in response
        json_match = re.search(r"\{[^{}]*\}", response, re.DOTALL)
        if not json_match:
            return None

        data = json.loads(json_match.group())

        # Normalize enum values
        stage = data.get("ukpf_stage", "other").lower().replace(" ", "_")
        intent = data.get("intent_type", "general").lower().replace(" ", "_")

        # Validate stage
        try:
            stage = UKPFStage(stage)
        except ValueError:
            stage = UKPFStage.OTHER

        # Validate intent
        try:
            intent = IntentType(intent)
        except ValueError:
            intent = IntentType.GENERAL

        return ExtractionResult(
            ukpf_stage=stage,
            intent_type=intent,
            pain_point=str(data.get("pain_point", ""))[:200],
            buying_intent_score=max(0.0, min(1.0, float(data.get("buying_intent_score", 0.0)))),
            products_mentioned=data.get("products_mentioned", [])
            if isinstance(data.get("products_mentioned"), list)
            else [],
        )
    except (json.JSONDecodeError, ValidationError, KeyError, TypeError) as e:
        logger.debug(f"Failed to parse LLM response: {e}")
        return None


def extract_from_text(content: str) -> ExtractionResult | None:
    """Extract structured info from a single text using configured LLM."""
    # Truncate long texts
    if len(content) > 1500:
        content = content[:1500] + "..."

    prompt = EXTRACTION_PROMPT.format(text=content)
    response = call_llm(prompt)
    return parse_llm_response(response)


def run_extraction(
    *,
    engine: Engine,
    subreddit: str = "UKPersonalFinance",
    limit: int = 100,
    min_signal_score: float = 0.5,
    force: bool = False,
) -> ExtractionStats:
    """Run LLM extraction on high-signal posts/comments."""

    # Fetch high-signal content not yet extracted
    with engine.begin() as conn:
        # Create intent_labels table if not exists
        conn.execute(
            text("""
            CREATE TABLE IF NOT EXISTS intent_labels (
                content_id TEXT PRIMARY KEY,
                content_type TEXT NOT NULL,
                ukpf_stage TEXT,
                intent_type TEXT,
                pain_point TEXT,
                buying_intent_score FLOAT,
                products_mentioned JSONB,
                model_used TEXT,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        """)
        )
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_intent_labels_stage ON intent_labels(ukpf_stage);
        """)
        )
        conn.execute(
            text("""
            CREATE INDEX IF NOT EXISTS idx_intent_labels_buying ON intent_labels(buying_intent_score DESC);
        """)
        )

    # Get content to process
    with engine.begin() as conn:
        if force:
            # Process regardless of existing labels
            rows = conn.execute(
                text("""
                SELECT s.content_id, s.content_type, 
                       CASE WHEN s.content_type = 'post' 
                            THEN COALESCE(p.title, '') || ' ' || COALESCE(p.body, '')
                            ELSE c.body END as text
                FROM signals s
                LEFT JOIN posts p ON s.content_type = 'post' AND s.content_id = p.post_id
                LEFT JOIN comments c ON s.content_type = 'comment' AND s.content_id = c.comment_id
                WHERE s.signal_score >= :min_score
                ORDER BY s.signal_score DESC
                LIMIT :limit
            """),
                {"min_score": min_signal_score, "limit": limit},
            ).fetchall()
        else:
            rows = conn.execute(
                text("""
                SELECT s.content_id, s.content_type, 
                       CASE WHEN s.content_type = 'post' 
                            THEN COALESCE(p.title, '') || ' ' || COALESCE(p.body, '')
                            ELSE c.body END as text
                FROM signals s
                LEFT JOIN posts p ON s.content_type = 'post' AND s.content_id = p.post_id
                LEFT JOIN comments c ON s.content_type = 'comment' AND s.content_id = c.comment_id
                LEFT JOIN intent_labels il ON s.content_id = il.content_id
                WHERE s.signal_score >= :min_score
                  AND il.content_id IS NULL
                ORDER BY s.signal_score DESC
                LIMIT :limit
            """),
                {"min_score": min_signal_score, "limit": limit},
            ).fetchall()

    processed = 0
    successful = 0
    failed = 0
    
    for row in rows:
        content_id, content_type, doc_text = row
        if not doc_text or len(doc_text.strip()) < 20:
            continue

        processed += 1
        result = extract_from_text(doc_text)

        if result:
            # Determine which model was used
            model_name = settings.groq_model if settings.llm_provider == "groq" else settings.ollama_model
            
            with engine.begin() as conn:
                conn.execute(
                    text("""
                    INSERT INTO intent_labels 
                        (content_id, content_type, ukpf_stage, intent_type, 
                         pain_point, buying_intent_score, products_mentioned, model_used)
                    VALUES (:cid, :ctype, :stage, :intent, :pain, :buying, :products, :model)
                    ON CONFLICT (content_id) DO UPDATE SET
                        ukpf_stage = EXCLUDED.ukpf_stage,
                        intent_type = EXCLUDED.intent_type,
                        pain_point = EXCLUDED.pain_point,
                        buying_intent_score = EXCLUDED.buying_intent_score,
                        products_mentioned = EXCLUDED.products_mentioned,
                        model_used = EXCLUDED.model_used,
                        created_at = now()
                """),
                    {
                        "cid": content_id,
                        "ctype": content_type,
                        "stage": result.ukpf_stage.value,
                        "intent": result.intent_type.value,
                        "pain": result.pain_point,
                        "buying": result.buying_intent_score,
                        "products": json.dumps(result.products_mentioned),
                        "model": model_name,
                    },
                )
            successful += 1
            logger.info(f"Extracted [{result.ukpf_stage.value}] {result.pain_point[:60]}...")
        else:
            failed += 1
            logger.warning(f"Failed to extract from {content_id}")

    return ExtractionStats(processed=processed, successful=successful, failed=failed)


def get_pain_points_by_stage(
    engine: Engine, stage: str | None = None, limit: int = 20
) -> list[dict]:
    """Get extracted pain points, optionally filtered by stage."""
    with engine.begin() as conn:
        if stage:
            rows = conn.execute(
                text("""
                SELECT il.content_id, il.content_type, il.ukpf_stage, il.intent_type,
                       il.pain_point, il.buying_intent_score, il.products_mentioned,
                       COALESCE(p.permalink, '') as permalink
                FROM intent_labels il
                LEFT JOIN posts p ON il.content_type = 'post' AND il.content_id = p.post_id
                WHERE il.ukpf_stage = :stage
                ORDER BY il.buying_intent_score DESC
                LIMIT :limit
            """),
                {"stage": stage, "limit": limit},
            ).fetchall()
        else:
            rows = conn.execute(
                text("""
                SELECT il.content_id, il.content_type, il.ukpf_stage, il.intent_type,
                       il.pain_point, il.buying_intent_score, il.products_mentioned,
                       COALESCE(p.permalink, '') as permalink
                FROM intent_labels il
                LEFT JOIN posts p ON il.content_type = 'post' AND il.content_id = p.post_id
                ORDER BY il.buying_intent_score DESC
                LIMIT :limit
            """),
                {"limit": limit},
            ).fetchall()

    return [
        {
            "content_id": r[0],
            "content_type": r[1],
            "ukpf_stage": r[2],
            "intent_type": r[3],
            "pain_point": r[4],
            "buying_intent_score": r[5],
            "products_mentioned": r[6],
            "permalink": r[7],
        }
        for r in rows
    ]


def get_stage_summary(engine: Engine) -> list[dict]:
    """Get count of pain points by UKPF stage."""
    with engine.begin() as conn:
        rows = conn.execute(
            text("""
            SELECT ukpf_stage, 
                   COUNT(*) as count,
                   AVG(buying_intent_score) as avg_buying_intent,
                   COUNT(CASE WHEN intent_type = 'recommendation_request' THEN 1 END) as recommendation_requests
            FROM intent_labels
            GROUP BY ukpf_stage
            ORDER BY count DESC
        """)
        ).fetchall()

    return [
        {
            "stage": r[0],
            "count": r[1],
            "avg_buying_intent": round(r[2] or 0, 3),
            "recommendation_requests": r[3],
        }
        for r in rows
    ]
