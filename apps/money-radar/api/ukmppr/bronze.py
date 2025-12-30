from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_bronze_json(*, bronze_dir: Path, rel_path: str, payload: Any) -> Path:
    path = bronze_dir / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return path
