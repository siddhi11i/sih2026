FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy dataset, scripts, backend and built frontend
COPY data/ data/
COPY scripts/ scripts/
COPY backend/ backend/
COPY frontend/dist/ frontend/dist/
COPY standards_dataset.csv .

# Run initial data validation and database ingestion
RUN python scripts/validate_data.py --ingest

EXPOSE 8080

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

CMD ["python", "backend/app/main.py"]
