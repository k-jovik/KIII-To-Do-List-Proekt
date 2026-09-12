# Todo List App

Simple full-stack Todo app with:
- PostgreSQL database
- Node.js/Express backend API
- Nginx + vanilla JS frontend

You can run it with:
1. Docker Compose
2. Kubernetes

---

## Project structure

```
/docker-compose.yml
/.github/workflows/ci.yml
/db/init.sql
/backend
  Dockerfile
  server.js
  package.json
/frontend
  Dockerfile
  index.html
```

---

## API endpoints

| Method | Path             | Description                           |
|--------|------------------|---------------------------------------|
| GET    | `/api/todos`     | Get all todos                         |
| POST   | `/api/todos`     | Create todo (`{ "title": "..." }`)    |
| PATCH  | `/api/todos/:id` | Toggle completed for one todo         |
| DELETE | `/api/todos/:id` | Delete one todo                       |

Backend also supports legacy `/todos` routes.

---

## Option A: Run with Docker Compose (step by step)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Steps
1. Open terminal in project root.
2. Run:
   ```bash
   docker-compose up --build
   ```
3. Wait until all services are up:
   - postgres on 5432
   - backend on 3000
   - frontend on 8080
4. Open:
   - `http://localhost:8080`
5. Test:
   - add todo
   - toggle todo
   - delete todo

### Stop
```bash
docker-compose down
```

Delete volumes too:
```bash
docker-compose down -v
```

---

## Option B: Run with Kubernetes (step by step)

This uses Docker Hub images:
- `YOUR_DOCKERHUB_USERNAME/todo-backend:latest`
- `YOUR_DOCKERHUB_USERNAME/todo-frontend:latest`

### Prerequisites
- Kubernetes cluster (Minikube or Docker Desktop Kubernetes)
- `kubectl` configured to the cluster
- Backend/frontend images pushed to Docker Hub

### Steps
1. Create namespace:
   ```bash
   kubectl create namespace todo-app
   ```

2. Create file `todo-app-k8s.yaml` and paste:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: postgres
     namespace: todo-app
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: postgres
     template:
       metadata:
         labels:
           app: postgres
       spec:
         containers:
           - name: postgres
             image: postgres:16-alpine
             ports:
               - containerPort: 5432
             env:
               - name: POSTGRES_USER
                 value: user
               - name: POSTGRES_PASSWORD
                 value: password
               - name: POSTGRES_DB
                 value: todos
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: postgres
     namespace: todo-app
   spec:
     selector:
       app: postgres
     ports:
       - port: 5432
         targetPort: 5432
   ---
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: todo-backend
     namespace: todo-app
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: todo-backend
     template:
       metadata:
         labels:
           app: todo-backend
       spec:
         containers:
           - name: todo-backend
             image: YOUR_DOCKERHUB_USERNAME/todo-backend:latest
             ports:
               - containerPort: 3000
             env:
               - name: DATABASE_URL
                 value: postgresql://user:password@postgres:5432/todos
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: todo-backend
     namespace: todo-app
   spec:
     selector:
       app: todo-backend
     ports:
       - port: 3000
         targetPort: 3000
   ---
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: todo-frontend
     namespace: todo-app
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: todo-frontend
     template:
       metadata:
         labels:
           app: todo-frontend
       spec:
         containers:
           - name: todo-frontend
             image: YOUR_DOCKERHUB_USERNAME/todo-frontend:latest
             ports:
               - containerPort: 80
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: todo-frontend
     namespace: todo-app
   spec:
     selector:
       app: todo-frontend
     ports:
       - port: 80
         targetPort: 80
   ```

3. Apply resources:
   ```bash
   kubectl apply -f todo-app-k8s.yaml
   ```

4. Check pods:
   ```bash
   kubectl get pods -n todo-app
   ```
   Wait until all pods are `Running`.

5. In terminal 1, forward backend to localhost:
   ```bash
   kubectl port-forward svc/todo-backend 3000:3000 -n todo-app
   ```

6. In terminal 2, forward frontend to localhost:
   ```bash
   kubectl port-forward svc/todo-frontend 8080:80 -n todo-app
   ```

7. Open:
   - `http://localhost:8080`

### Stop / cleanup
- Stop port-forward with `Ctrl + C`
- Remove all resources:
  ```bash
  kubectl delete namespace todo-app
  ```

---

## CI/CD pipeline (GitHub Actions)

Pipeline file: `.github/workflows/ci.yml`

### Trigger
- Runs on push to `main` or `master`

### What it does
1. Checkout repository
2. Set up Docker Buildx
3. Login to Docker Hub
4. Build and push backend image:
   - `${DOCKER_USERNAME}/todo-backend:latest`
5. Build and push frontend image:
   - `${DOCKER_USERNAME}/todo-frontend:latest`

### Required GitHub Secrets
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

### Important note
This pipeline currently builds and pushes images to Docker Hub.  
Kubernetes deployment is manual via `kubectl` (steps above).
