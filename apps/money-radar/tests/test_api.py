"""
Tests for the FastAPI endpoints.
"""

import pytest


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_returns_ok(self, client):
        """Health endpoint should return status ok."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "database" in data
        assert "timestamp" in data


class TestStatsEndpoint:
    """Tests for the stats endpoint."""

    def test_stats_returns_counts(self, client):
        """Stats endpoint should return post and signal counts."""
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "signals" in data
        assert "comments" in data
        assert "clusters" in data


class TestThemesEndpoint:
    """Tests for the themes endpoint."""

    def test_themes_list(self, client):
        """Should return list of themes."""
        response = client.get("/api/themes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_theme_detail(self, client):
        """Should return theme details when theme exists."""
        # First get list of themes
        themes = client.get("/api/themes").json()
        if themes:
            cluster_id = themes[0]["cluster_id"]
            response = client.get(f"/api/themes/{cluster_id}")
            assert response.status_code == 200
            data = response.json()
            assert "cluster_id" in data
            assert "label" in data


class TestSignalsEndpoint:
    """Tests for the signals endpoint."""

    def test_signals_list(self, client):
        """Should return list of signals."""
        response = client.get("/api/signals")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_signals_limit(self, client):
        """Should respect limit parameter."""
        response = client.get("/api/signals?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5

    def test_signals_min_score_filter(self, client):
        """Should filter by minimum signal score."""
        response = client.get("/api/signals?min_score=0.7")
        assert response.status_code == 200
        data = response.json()
        for signal in data:
            assert signal["signal_score"] >= 0.7


class TestPostsEndpoint:
    """Tests for the posts endpoint."""

    def test_posts_list(self, client):
        """Should return list of posts."""
        response = client.get("/api/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_post_detail(self, client):
        """Should return post details when post exists."""
        posts = client.get("/api/posts?limit=1").json()
        if posts:
            post_id = posts[0]["content_id"]
            response = client.get(f"/api/posts/{post_id}")
            assert response.status_code == 200
            data = response.json()
            assert "post" in data
            assert "title" in data["post"]


class TestTrendsEndpoint:
    """Tests for the trends endpoint."""

    def test_trends_weekly(self, client):
        """Should return weekly trend data."""
        response = client.get("/api/trends/weekly")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_trends_themes(self, client):
        """Should return trending themes."""
        response = client.get("/api/trends/themes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


@pytest.fixture
def client():
    """Create test client for the FastAPI app."""
    from fastapi.testclient import TestClient
    from ukmppr.api.main import app

    return TestClient(app)
