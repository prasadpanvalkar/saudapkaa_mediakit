#!/bin/bash
echo "Starting Saudapakka in Development Mode..."
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
