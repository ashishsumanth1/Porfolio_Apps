from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class RateLimited(RuntimeError):
    pass


@dataclass(frozen=True)
class RedditListing:
    items: list[dict[str, Any]]
    after: str | None


class RedditClient:
    def __init__(self, *, user_agent: str, timeout_s: float = 30.0) -> None:
        self._client = httpx.Client(
            headers={"User-Agent": user_agent},
            timeout=timeout_s,
            follow_redirects=True,
        )

    def close(self) -> None:
        self._client.close()

    @retry(
        retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError, RateLimited)),
        wait=wait_exponential(multiplier=1, min=1, max=60),
        stop=stop_after_attempt(6),
        reraise=True,
    )
    def fetch_listing(
        self,
        *,
        subreddit: str,
        feed: str = "new",
        limit: int = 100,
        after: str | None = None,
    ) -> RedditListing:
        base = f"https://www.reddit.com/r/{subreddit}/{feed}.json"
        params: dict[str, Any] = {"limit": limit, "raw_json": 1}
        if after:
            params["after"] = after

        resp = self._client.get(base, params=params)
        if resp.status_code == 429:
            raise RateLimited("429 from reddit")
        resp.raise_for_status()

        payload = resp.json()
        data = payload.get("data") or {}
        children = data.get("children") or []
        items = [
            c.get("data")
            for c in children
            if isinstance(c, dict) and isinstance(c.get("data"), dict)
        ]
        return RedditListing(items=items, after=data.get("after"))

    @retry(
        retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError, RateLimited)),
        wait=wait_exponential(multiplier=1, min=1, max=60),
        stop=stop_after_attempt(6),
        reraise=True,
    )
    def fetch_thread_json(
        self,
        *,
        post_id: str,
        limit: int = 500,
        sort: str = "top",
    ) -> Any:
        """Fetch a thread (post + comment tree) as JSON.

        Uses public Reddit JSON endpoints (no OAuth). For deep trees, Reddit may return
        "more" placeholders; we ignore those in normalisation for MVP.
        """
        url = f"https://www.reddit.com/comments/{post_id}.json"
        params: dict[str, Any] = {"raw_json": 1, "limit": limit, "sort": sort}

        resp = self._client.get(url, params=params)
        if resp.status_code == 429:
            raise RateLimited("429 from reddit")
        resp.raise_for_status()
        return resp.json()

    def dump_json(self, payload: Any) -> str:
        return json.dumps(payload, ensure_ascii=False, sort_keys=True)
