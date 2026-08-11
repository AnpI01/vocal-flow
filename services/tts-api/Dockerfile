FROM python:3.12-slim

# System deps: soundfile needs libsndfile, torch/qwen may need build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

WORKDIR /app

# Copy dependency files first for better layer caching
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY app ./app

# Create dirs the app expects (also created at runtime by config.py, but
# good to have them present with correct permissions from the start)
RUN mkdir -p temp/uploads temp/outputs cache

EXPOSE 8000

# CPU-only: no CUDA, torch will fall back automatically via your
# get_device() check in qwen_engine.py
ENV MODEL_NAME="Qwen/Qwen3-TTS-12Hz-1.7B-Base"

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
