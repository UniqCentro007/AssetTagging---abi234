# Asset Tagging for Media Teams AI

## Overview

This project is a media asset tagging application with support for image, video, and audio analysis.
It includes:
- FastAPI backend for AI asset detection, audio transcription, video frame inspection, history storage, and optional RAG chat
- React frontend for uploading media, tracking history, and interacting with the AI assistant
- SQLite database for local storage and portable execution
- Docker Compose support for easy distribution and execution

## Features

- Image object detection with custom tag queries
- Video frame tagging in background processing
- Audio recognition and transcription
- Upload history with edit/delete support
- Optional AI chat powered by Ollama / Llama 3 when enabled

## Run locally

### 1. Backend

```bash
cd backend
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://127.0.0.1:8000`.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will load at `http://localhost:3000`.

### 3. Use the app

Open `http://localhost:3000` in your browser.
The frontend sends requests to `http://127.0.0.1:8000`.

## Run with Docker Compose

A Docker-based runnable environment is provided for easier distribution.

```bash
chmod +x run.sh
./run.sh
```

This will build and start both:
- `backend` on port `8000`
- `frontend` on port `3000`

## Notes

- The backend now uses SQLite (`asset_db.sqlite3`) by default, so no PostgreSQL server is required.
- The first model load may take time the first time it downloads weights.
- If you want chat support, start Ollama separately and set `ENABLE_RAG=true` in `docker-compose.yml` or your environment.

## Folder structure

- `backend/` — FastAPI application and model logic
- `frontend/` — React UI
- `docker-compose.yml` — container orchestration for backend + frontend
- `run.sh` — convenience launcher

## Checklist for distribution

- `docker-compose.yml` added for full app execution
- `backend/Dockerfile` and `frontend/Dockerfile` added for container builds
- `backend/requirements.txt` updated with all runtime dependencies
- `backend/database.py` updated to use SQLite for portable execution
- `README.md` updated with install and run instructions

