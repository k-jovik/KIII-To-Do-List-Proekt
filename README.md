# Todo List App (Kubernetes & CI/CD)

A full-stack Todo List application containerized, deployed on a local Kubernetes cluster via NGINX Ingress, and automated with a GitHub Actions CI/CD pipeline.

1. **Database** — PostgreSQL running as a StatefulSet with a persistent volume and automated initialization.
2. **Backend** — Node.js/Express REST API with explicit `/api` routing and health check connection retries.
3. **Frontend** — Static `index.html` (vanilla JS) served via NGINX.
4. **Ingress** — NGINX Ingress Controller routing traffic to `http://todo.local`.

## Project structure

```
/.github/workflows
  ci-cd.yml           GitHub Actions CI/CD pipeline definition
/k8s
  namespace.yaml      Defines todo-namespace
  postgres.yaml       PostgreSQL StatefulSet, Service, and ConfigMap init script
  backend.yaml        Backend Deployment and Service manifests
  frontend.yaml       Frontend Deployment and Service manifests
  ingress.yaml        NGINX Ingress configuration for todo.local
/db
  init.sql            Creates the todos table on first startup
/backend
  Dockerfile
  server.js
  package.json
/frontend
  Dockerfile
  index.html
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/) (with Kubernetes enabled)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) command-line tool

## Local Deployment & Setup

1. **Enable Kubernetes** in Docker Desktop settings.
2. **Install the NGINX Ingress Controller** (if not already installed):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
   ```
3. **Map the local domain** in your hosts file (`C:\Windows\System32\drivers\etc\hosts` or `/etc/hosts`):
   ```text
   127.0.0.1  todo.local
   ```
4. **Build the local Docker images**:
   ```bash
   docker build -t kikodocker2004/todo-backend:v2 ./backend
   docker build -t kikodocker2004/todo-frontend:v2 ./frontend
   ```
5. **Apply all Kubernetes manifests**:
   ```bash
   kubectl apply -f ./k8s/ -n todo-namespace
   ```

### API Endpoints (via Ingress)

| Method | Path | Description |
|--------|--------------|-------------------------------------|
| GET | `/api/todos` | Returns all todos |
| POST | `/api/todos` | Creates a todo, body: `{ "title": "..." }` |
| PATCH | `/api/todos/:id` | Toggles a todo's `completed` state |
| DELETE | `/api/todos/:id` | Deletes a todo |

## Open the App

Visit `http://todo.local` in a browser.

## CI/CD Pipeline (GitHub Actions)

The repository includes an automated GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that triggers on pushes to the main branch. 

- **Build & Test**: Automatically builds the Docker images for both backend and frontend services.
- **Registry Push**: Authenticates and pushes updated image tags (`:v2`) to Docker Hub (`kikodocker2004/`).

## Cleaning Up

To delete all application resources from the cluster:
```bash
kubectl delete namespace todo-namespace
```

To entirely stop and disable Kubernetes, uncheck **Enable Kubernetes** under settings in Docker Desktop.