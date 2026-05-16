#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "Error: docker-compose is not installed. Install Docker and docker-compose, or run the backend and frontend manually."
  exit 1
fi

docker-compose up --build
