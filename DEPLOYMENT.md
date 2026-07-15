# Deployment

This project has three services:

- `environment`: public API and WebSocket service.
- `viewer`: public Nuxt UI.
- `trainer`: private/background job for random or PPO training.

Only `environment` and `viewer` should be public web services. The trainer should run as a job when you want to train.

## VPS / Own Server

1. Copy `.env.production.example` to `.env.production`.
2. Edit these values if your domain changes:

```text
NUXT_PUBLIC_ENVIRONMENT_BASE_URL=http://your-server:3001
ENVIRONMENT_CORS_ORIGIN=http://your-server:3000
```

3. Start the public app:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d environment viewer
```

4. Open:

```text
http://your-server:3000
```

5. Run random agent training as a job:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm trainer
```

6. Run PPO training as a job:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm -e TRAINER_MODE=ppo trainer
```

Generated PPO models are saved in:

```text
trainer/models/
```

## Render

Use `render.yaml` as a Render Blueprint.

Expected public services:

```text
warehouse-rl-environment -> https://warehouse-rl-environment.onrender.com
warehouse-rl-viewer      -> https://warehouse-rl-viewer.onrender.com
```

If Render gives your services different URLs, update:

```text
NUXT_PUBLIC_ENVIRONMENT_BASE_URL
ENVIRONMENT_CORS_ORIGIN
```

The trainer is not included as an always-on Render web service because training is a job, not a website. Run training from a server, local machine, or a Render job/worker using the trainer Dockerfile.

## Important Production Notes

- Browser users must reach `NUXT_PUBLIC_ENVIRONMENT_BASE_URL`.
- Do not set the viewer API URL to `http://environment:3001` in public deployments. That hostname only works inside Docker.
- Keep trainer endpoints private. Users should interact with the viewer, not the trainer.
- Free web services can sleep on some platforms. If the viewer appears stuck, first check whether the environment service is awake.
