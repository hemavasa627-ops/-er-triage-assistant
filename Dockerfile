# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build


# Stage 2: Python Backend + Java 17
FROM python:3.12-slim

WORKDIR /app

# Install Java 17 and required utilities
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configure Java
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
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

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Compile Java source files
RUN mkdir -p java-module/bin && \
    javac -d java-module/bin java-module/src/er/triage/*.java

# Configure port
EXPOSE 8000
ENV PORT=8000

# Start FastAPI
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
