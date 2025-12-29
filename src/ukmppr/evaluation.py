"""
Evaluation harness for UK Money Pain Point Radar.

Provides:
- Labelled test set management
- Metrics computation (precision, recall, F1)
- Regression test runner
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)

# Default test set location
DEFAULT_TEST_SET_PATH = Path("data/eval/test_set.jsonl")


@dataclass
class LabelledItem:
    """A manually labelled test item."""

    content_id: str
    content_type: str  # 'post' or 'comment'
    text: str
    labels: dict[str, bool] = field(default_factory=dict)
    # Labels can include: is_pain_point, is_question, asks_recommendation,
    # mentions_cost, mentions_platform, expected_cluster
    notes: str = ""


@dataclass
class EvalMetrics:
    """Evaluation metrics for a single label."""

    label: str
    true_positives: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    true_negatives: int = 0

    @property
    def precision(self) -> float:
        denom = self.true_positives + self.false_positives
        return self.true_positives / denom if denom > 0 else 0.0

    @property
    def recall(self) -> float:
        denom = self.true_positives + self.false_negatives
        return self.true_positives / denom if denom > 0 else 0.0

    @property
    def f1(self) -> float:
        p, r = self.precision, self.recall
        return 2 * p * r / (p + r) if (p + r) > 0 else 0.0

    @property
    def accuracy(self) -> float:
        total = (
            self.true_positives + self.true_negatives + self.false_positives + self.false_negatives
        )
        return (self.true_positives + self.true_negatives) / total if total > 0 else 0.0


@dataclass
class EvalReport:
    """Full evaluation report."""

    test_set_size: int
    metrics_by_label: dict[str, EvalMetrics]
    timestamp: str = ""

    def summary(self) -> str:
        lines = [
            f"Evaluation Report ({self.test_set_size} items)",
            "=" * 50,
        ]
        for label, m in self.metrics_by_label.items():
            lines.append(
                f"{label:25s} P={m.precision:.3f} R={m.recall:.3f} F1={m.f1:.3f} Acc={m.accuracy:.3f}"
            )
        return "\n".join(lines)


def load_test_set(path: Path = DEFAULT_TEST_SET_PATH) -> list[LabelledItem]:
    """Load labelled test set from JSONL file."""
    if not path.exists():
        logger.warning(f"Test set not found at {path}")
        return []

    items = []
    with open(path) as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                items.append(
                    LabelledItem(
                        content_id=data["content_id"],
                        content_type=data["content_type"],
                        text=data.get("text", ""),
                        labels=data.get("labels", {}),
                        notes=data.get("notes", ""),
                    )
                )
    logger.info(f"Loaded {len(items)} labelled items from {path}")
    return items


def save_test_set(items: list[LabelledItem], path: Path = DEFAULT_TEST_SET_PATH) -> None:
    """Save labelled test set to JSONL file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        for item in items:
            data = {
                "content_id": item.content_id,
                "content_type": item.content_type,
                "text": item.text,
                "labels": item.labels,
                "notes": item.notes,
            }
            f.write(json.dumps(data) + "\n")
    logger.info(f"Saved {len(items)} items to {path}")


def sample_for_labelling(
    engine: Engine,
    n_posts: int = 100,
    n_comments: int = 100,
    min_signal_score: float = 0.3,
) -> list[LabelledItem]:
    """
    Sample posts and comments for manual labelling.

    Prioritizes high-signal items for better evaluation coverage.
    """
    items = []

    with engine.connect() as conn:
        # Sample posts with signals
        posts = conn.execute(
            text("""
            SELECT p.post_id, p.title, p.body, s.signal_score
            FROM posts p
            LEFT JOIN signals s ON s.content_id = p.post_id AND s.content_type = 'post'
            ORDER BY COALESCE(s.signal_score, 0) DESC, RANDOM()
            LIMIT :n
        """),
            {"n": n_posts},
        ).fetchall()

        for post_id, title, body, score in posts:
            text_content = f"{title or ''}\n{body or ''}".strip()
            items.append(
                LabelledItem(
                    content_id=post_id,
                    content_type="post",
                    text=text_content[:1000],  # Truncate for labelling
                    labels={},
                )
            )

        # Sample comments with signals
        comments = conn.execute(
            text("""
            SELECT c.comment_id, c.body, s.signal_score
            FROM comments c
            LEFT JOIN signals s ON s.content_id = c.comment_id AND s.content_type = 'comment'
            WHERE c.body IS NOT NULL AND LENGTH(c.body) > 50
            ORDER BY COALESCE(s.signal_score, 0) DESC, RANDOM()
            LIMIT :n
        """),
            {"n": n_comments},
        ).fetchall()

        for comment_id, body, score in comments:
            items.append(
                LabelledItem(
                    content_id=comment_id,
                    content_type="comment",
                    text=(body or "")[:1000],
                    labels={},
                )
            )

    logger.info(f"Sampled {len(items)} items for labelling")
    return items


def evaluate_signals(
    engine: Engine,
    test_items: list[LabelledItem],
) -> EvalReport:
    """
    Evaluate signal detection against labelled test set.

    Compares system's signal predictions vs ground truth labels.
    """
    from datetime import datetime

    label_names = ["is_question", "asks_recommendation", "mentions_cost", "mentions_platform"]
    metrics = {label: EvalMetrics(label=label) for label in label_names}

    with engine.connect() as conn:
        for item in test_items:
            # Get system prediction
            row = conn.execute(
                text("""
                SELECT is_question, asks_recommendation, mentions_cost, mentions_platform
                FROM signals
                WHERE content_id = :cid AND content_type = :ctype
            """),
                {"cid": item.content_id, "ctype": item.content_type},
            ).fetchone()

            for label in label_names:
                ground_truth = item.labels.get(label, False)
                predicted = getattr(row, label, False) if row else False

                m = metrics[label]
                if ground_truth and predicted:
                    m.true_positives += 1
                elif ground_truth and not predicted:
                    m.false_negatives += 1
                elif not ground_truth and predicted:
                    m.false_positives += 1
                else:
                    m.true_negatives += 1

    return EvalReport(
        test_set_size=len(test_items),
        metrics_by_label=metrics,
        timestamp=datetime.utcnow().isoformat(),
    )


def run_regression_tests(engine: Engine, test_set_path: Path = DEFAULT_TEST_SET_PATH) -> bool:
    """
    Run regression tests against baseline metrics.

    Returns True if all metrics meet minimum thresholds.
    """
    test_items = load_test_set(test_set_path)
    if not test_items:
        logger.warning("No test set found, skipping regression tests")
        return True

    report = evaluate_signals(engine, test_items)
    print(report.summary())

    # Minimum thresholds (can be adjusted)
    MIN_F1 = 0.5
    MIN_PRECISION = 0.4

    all_passed = True
    for label, m in report.metrics_by_label.items():
        if m.f1 < MIN_F1:
            logger.error(f"FAIL: {label} F1={m.f1:.3f} < {MIN_F1}")
            all_passed = False
        if m.precision < MIN_PRECISION:
            logger.error(f"FAIL: {label} Precision={m.precision:.3f} < {MIN_PRECISION}")
            all_passed = False

    if all_passed:
        logger.info("All regression tests PASSED")

    return all_passed


def export_predictions_for_review(
    engine: Engine,
    output_path: Path,
    limit: int = 200,
) -> int:
    """
    Export system predictions for manual review and labelling.

    Creates a JSONL file with predictions that can be reviewed and corrected.
    """
    items = []

    with engine.connect() as conn:
        rows = conn.execute(
            text("""
            SELECT 
                s.content_id,
                s.content_type,
                CASE 
                    WHEN s.content_type = 'post' THEN COALESCE(p.title || E'\n' || p.body, p.title, p.body, '')
                    ELSE c.body
                END AS text,
                s.is_question,
                s.asks_recommendation,
                s.mentions_cost,
                s.mentions_platform,
                s.signal_score
            FROM signals s
            LEFT JOIN posts p ON s.content_id = p.post_id AND s.content_type = 'post'
            LEFT JOIN comments c ON s.content_id = c.comment_id AND s.content_type = 'comment'
            ORDER BY s.signal_score DESC
            LIMIT :limit
        """),
            {"limit": limit},
        ).fetchall()

        for row in rows:
            items.append(
                {
                    "content_id": row.content_id,
                    "content_type": row.content_type,
                    "text": (row.text or "")[:1000],
                    "predictions": {
                        "is_question": row.is_question,
                        "asks_recommendation": row.asks_recommendation,
                        "mentions_cost": row.mentions_cost,
                        "mentions_platform": row.mentions_platform,
                    },
                    "signal_score": row.signal_score,
                    "labels": {},  # To be filled by human reviewer
                    "notes": "",
                }
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        for item in items:
            f.write(json.dumps(item) + "\n")

    logger.info(f"Exported {len(items)} predictions to {output_path}")
    return len(items)
