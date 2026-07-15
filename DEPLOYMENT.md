# Production deployment with Docker and Nginx

This guide deploys Warehouse RL Control on one Ubuntu VPS. Nginx is the only
public container. The viewer, environment API, and trainer API remain private
inside the Docker network.

```text
Internet
   │
   ▼
Nginx :80/:443
   ├── /                  → Viewer :3000
   ├── /api/environment/  → Environment :3001
   └── /api/trainer/      → Trainer :8000
```

The WebSocket at `/api/environment/events` is also proxied by Nginx.

## Server requirements

Recommended minimum for PPO training:

- Ubuntu 22.04 or 24.04
- 4 CPU cores
- 8 GB RAM
- 25 GB disk
- A public IPv4 address
- A domain name for HTTPS

Small CPU-only PPO runs can work on a smaller server, but training will be
slower. This stack does not require a GPU.

## 1. Point your domain to the server

At your DNS provider, create an `A` record:

```text
Type: A
Name: warehouse       # or @ for the root domain
Value: YOUR_SERVER_IP
TTL: Auto
```

Example result:

```text
warehouse.example.com → 203.0.113.10
```

DNS can take time to update. Verify it from your computer:

```bash
nslookup warehouse.example.com
```

## 2. Connect to the VPS

```bash
ssh root@YOUR_SERVER_IP
```

Create a normal deployment user if the server does not already have one:

```bash
adduser warehouse
usermod -aG sudo warehouse
su - warehouse
```

## 3. Install Docker and Git

Use Docker's official Ubuntu installation instructions, then verify:

```bash
docker --version
docker compose version
git --version
```

Add the deployment user to the Docker group:

```bash
sudo usermod -aG docker "$USER"
```

Log out and reconnect for the group change to apply.

## 4. Open the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Do not open ports `3000`, `3001`, or `8000`. They are private Docker services.

## 5. Clone the project

```bash
git clone https://github.com/Ankit1787/Rl-Env.git
cd Rl-Env
```

Confirm you are in the correct folder:

```bash
ls docker-compose.prod.yml nginx/nginx.conf
```

## 6. Create production configuration

```bash
cp .env.production.example .env.production
nano .env.production
```

The defaults work behind the included Nginx proxy. At minimum, review:

```text
HTTP_PORT=80
WAREHOUSE_GRID_WIDTH=4
WAREHOUSE_GRID_HEIGHT=4
WAREHOUSE_MAX_STEPS=10
PPO_MODEL_PATH=/app/models/warehouse_ppo.zip
```

Do not commit `.env.production` if you later add secrets.

## 7. Start production

```bash
docker compose \
  -f docker-compose.prod.yml \
  --env-file .env.production \
  up --build -d
```

Check containers:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

Expected services:

```text
nginx        healthy, public port 80
viewer       running, internal port 3000
environment  healthy, internal port 3001
trainer      running, internal port 8000
```

Check the public proxy:

```bash
curl http://localhost/health
curl http://localhost/api/environment/health
curl http://localhost/api/trainer/health
```

Open:

```text
http://warehouse.example.com
```

## 8. Add HTTPS

Do not expose a production login or control interface permanently over plain
HTTP. Terminate TLS before sending public traffic to port 80.

Two common options are:

### Option A: cloud load balancer or CDN

Configure your provider, Cloudflare, or load balancer to:

1. Serve `https://warehouse.example.com` with a valid certificate.
2. Forward origin traffic to `YOUR_SERVER_IP:80`.
3. Enable WebSocket proxying.
4. Redirect HTTP to HTTPS at the provider.

No application URL changes are needed because the browser uses same-origin
paths such as `/api/environment` and `/api/trainer`.

### Option B: host-level TLS proxy

Run a certificate-managing proxy on the host and forward it to the included
Nginx container. Change `HTTP_PORT` in `.env.production` to a loopback-only high
port through a Compose override, then proxy your HTTPS domain to it. The exact
certificate commands depend on your provider and domain. Never copy private TLS
keys into Git.

After HTTPS is active, verify both HTTP API calls and the live `wss://`
WebSocket by checking that the browser shows `CONNECTED`.

## Updating the deployment

```bash
cd Rl-Env
git pull --rebase
docker compose \
  -f docker-compose.prod.yml \
  --env-file .env.production \
  up --build -d
```

Docker recreates changed services. The trained model remains in
`trainer/models/warehouse_ppo.zip` because that directory is mounted into the
trainer container.

## Logs and status

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# One service
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f viewer
docker compose -f docker-compose.prod.yml logs -f environment
docker compose -f docker-compose.prod.yml logs -f trainer

# Current training status through Nginx
curl http://localhost/api/trainer/training/status
```

## Restarting and stopping

```bash
# Restart
docker compose -f docker-compose.prod.yml restart

# Stop and remove containers; model files remain on disk
docker compose -f docker-compose.prod.yml down

# Start again without rebuilding
docker compose \
  -f docker-compose.prod.yml \
  --env-file .env.production \
  up -d
```

Do not use `docker compose down -v` unless you intentionally want to remove
Docker-managed volumes.

## Production security notes

- Only ports 80 and 443 should be public.
- Add authentication before allowing untrusted users to start training; PPO can
  consume significant CPU and memory.
- Use HTTPS in public deployments.
- Back up `trainer/models/` if trained models are important.
- Keep Docker, the base images, and server packages updated.
- Review Nginx and trainer logs for unexpected public usage.
- Consider rate limiting `/api/trainer/training/start` before a public launch.

## Common problems

### Nginx returns 502

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 nginx viewer environment trainer
```

A backend may still be starting or may have failed its health check.

### Browser says disconnected

Check the WebSocket route:

```bash
curl -i http://localhost/api/environment/health
docker compose -f docker-compose.prod.yml logs --tail=100 nginx environment
```

If a CDN or load balancer provides HTTPS, confirm that WebSockets are enabled.

### Training results disappear after a restart

The current run status is stored in trainer memory, so restarting the trainer
clears the displayed status. The saved model file remains on disk. Persistent
run-history storage can be added separately if required.
