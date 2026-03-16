# ASSist Backend - Optimized for Jetson Orin Nano (ARM64)
FROM python:3.11-slim

WORKDIR /app

# Security: Run as non-root user
RUN groupadd -r assist && useradd -r -g assist assist

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/

# Switch to non-root user
RUN chown -R assist:assist /app
USER assist

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "warning", "--no-access-log"]
