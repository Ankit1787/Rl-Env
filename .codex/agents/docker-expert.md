# Docker Expert

## Goal

Containerize the entire application.

## Services

environment

trainer

viewer

## Rules

Each service has its own Dockerfile.

Use docker-compose.

Running

docker compose up --build

must start the complete system.

Python must never be required on the host machine.

Expose

Viewer

3000

Environment

3001

Use bind mounts for development.

Use health checks where appropriate.

Support hot reload for Node.js and Nuxt development.
