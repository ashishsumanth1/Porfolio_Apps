from __future__ import annotations

import json
from dataclasses import dataclass
import time
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
    def __init__(
        self,
        *,
        user_agent: str,
        timeout_s: float = 30.0,
        client_id: str | None = None,
        client_secret: str | None = None,
    ) -> None:
        self._user_agent = user_agent
        self._client_id = client_id
        self._client_secret = client_secret
        self._use_oauth = bool(client_id and client_secret)
        self._token: str | None = None
        self._token_expiry: float = 0.0
        self._base_url = "https://oauth.reddit.com" if self._use_oauth else "https://www.reddit.com"
        self._client = httpx.Client(
            headers={"User-Agent": user_agent},
            timeout=timeout_s,
            follow_redirects=True,
        )

    def close(self) -> None:
        self._client.close()

    def _ensure_token(self) -> None:
        if not self._use_oauth:
            return
        if self._token and time.time() < self._token_expiry:
            return
        if not self._client_id or not self._client_secret:
            raise RuntimeError("OAuth requested but client_id/client_secret missing")

        resp = self._client.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(self._client_id, self._client_secret),
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": self._user_agent},
        )
        resp.raise_for_status()
        payload = resp.json()
        self._token = payload.get("access_token")
        expires_in = float(payload.get("expires_in", 3600))
        self._token_expiry = time.time() + max(expires_in - 60, 0)

    def _get(self, path: str, params: dict[str, Any]) -> httpx.Response:
        if self._use_oauth:
            self._ensure_token()
            headers = {"Authorization": f"bearer {self._token}"}
            return self._client.get(f"{self._base_url}{path}", params=params, headers=headers)
        return self._client.get(f"{self._base_url}{path}", params=params)

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
        base = f"/r/{subreddit}/{feed}.json"
        params: dict[str, Any] = {"limit": limit, "raw_json": 1}
        if after:
            params["after"] = after

        resp = self._get(base, params)
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
        url = f"/comments/{post_id}.json"
        params: dict[str, Any] = {"raw_json": 1, "limit": limit, "sort": sort}

        resp = self._get(url, params)
        if resp.status_code == 429:
            raise RateLimited("429 from reddit")
        resp.raise_for_status()
        return resp.json()

    def dump_json(self, payload: Any) -> str:
        return json.dumps(payload, ensure_ascii=False, sort_keys=True)
