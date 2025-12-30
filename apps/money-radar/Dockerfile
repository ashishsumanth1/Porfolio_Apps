# UK Money Pain Point Radar
# Multi-stage build for production deployment

FROM python:3.13-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY pyproject.toml README.md ./
COPY api/ ./api/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .


# Production image
FROM python:3.13-slim AS runtime

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY api/ ./api/

# Create non-root user
RUN useradd -m -r appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app
USER appuser

# Default environment variables
ENV UKMPPR_LOG_LEVEL=INFO
ENV UKMPPR_BRONZE_DIR=/app/data/bronze

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "from ukmppr.db import get_engine; get_engine().connect()" || exit 1

# Default command
CMD ["python", "-m", "ukmppr", "--help"]
