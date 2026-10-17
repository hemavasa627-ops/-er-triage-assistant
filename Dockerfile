# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build


# Stage 2: Python Backend + Java Runtime
FROM python:3.12-slim

WORKDIR /app

# Install Java and system utilities (uses standard Debian package default-jdk-headless with fallbacks)
RUN apt-get update && \
    (apt-get install -y --no-install-recommends default-jdk-headless curl || \
     apt-get install -y --no-install-recommends openjdk-17-jdk curl || \
     apt-get install -y --no-install-recommends default-jre-headless curl || true) && \
    rm -rf /var/lib/apt/lists/*

# Configure Java environment
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Configure Python Path
ENV PYTHONPATH="/app/backend:${PYTHONPATH}"

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY backend/ ./backend/
COPY java-module/ ./java-module/
COPY shared/ ./shared/
COPY tests/ ./tests/
COPY docs/ ./docs/
COPY README.md ./

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Compile Java source files if javac is available
RUN mkdir -p java-module/bin && \
    if command -v javac >/dev/null 2>&1; then \
        javac -d java-module/bin java-module/src/er/triage/*.java; \
    fi

# Configure port
EXPOSE 8000
ENV PORT=8000

# Start FastAPI server bound to 0.0.0.0 and dynamic $PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
