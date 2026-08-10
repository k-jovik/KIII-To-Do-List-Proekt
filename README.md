# Todo List App

A full-stack Todo List application made of three independent services, each containerized and orchestrated with Docker Compose:

1. **Database** — PostgreSQL, on port `5432`
2. **Backend** — Node.js/Express REST API, on port `3000`
3. **Frontend** — static `index.html` (vanilla JS) served by nginx, on port `8080`

## Project structure

```
/docker-compose.yml     orchestrates all three services
/db/init.sql             creates the todos table on first startup
/backend
  Dockerfile
  server.js
  package.json
/frontend
  Dockerfile
  index.html
```

## Prerequisites

- [Docker](https://www.docker.com/) (with Docker Compose)

## Start everything

```bash
docker-compose up --build
```

This single command builds the backend and frontend images and starts all three containers:

- **postgres** — user `user`, password `password`, database `todos`. The `todos` table is created automatically on first startup via `db/init.sql`.
- **backend** — waits for postgres to be healthy, then connects using `DATABASE_URL=postgresql://user:password@postgres:5432/todos` (the containers talk to each other by service name over the Compose network).
- **frontend** — nginx serving `index.html`, which calls the backend at `http://localhost:3000` from your browser.

Add `-d` to run in the background instead: `docker-compose up --build -d`.

After the first build, plain `docker-compose up` is enough — only add `--build` again after changing `backend/` or `frontend/` code.

### API endpoints

| Method | Path         | Description                        |
|--------|--------------|-------------------------------------|
| GET    | `/todos`     | Returns all todos                   |
| POST   | `/todos`     | Creates a todo, body: `{ "title": "..." }` |
| PATCH  | `/todos/:id` | Toggles a todo's `completed` state  |
| DELETE | `/todos/:id` | Deletes a todo                      |

## Open the app

Visit `http://localhost:8080` in a browser.

## Testing it all together

1. `docker-compose up --build`
2. Open `http://localhost:8080`
3. Add a todo, check it off (strikethrough applied), delete it — each action hits the backend, which reads/writes PostgreSQL, so refreshing the page preserves your todos.

## Stopping everything

```bash
docker-compose down
```

Add `-v` to also wipe the stored database data.
