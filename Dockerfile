# Multi-stage Dockerfile for ER TRIAGE ASSISTANT
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime with Python 3.12 and OpenJDK 17
FROM python:3.12-slim

# Install OpenJDK 17 for Java OOP Module and git/curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    openjdk-17-jdk-headless \
    curl \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

WORKDIR /app

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/ ./backend/
COPY java-module/ ./java-module/
COPY shared/ ./shared/
COPY tests/ ./tests/
COPY docs/ ./docs/
COPY README.md ./

# Copy compiled frontend from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Compile Java classes so they are immediately available
RUN mkdir -p java-module/bin && \
    javac -d java-module/bin java-module/src/er/triage/*.java

# Expose port (default 8000, overridable by $PORT)
EXPOSE 8000
ENV PORT=8000

# Start FastAPI application
CMD ["python", "backend/main.py"]
