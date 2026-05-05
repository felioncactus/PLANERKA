# Installation

This guide describes how to run the project locally using the scripts and environment files included in the repository.

## Prerequisites

Install:

- Node.js LTS
- npm
- PostgreSQL

Check versions:

```bash
node -v
npm -v
psql --version
```

On Windows, if `psql` or `createdb` are not found, add the PostgreSQL `bin` folder to `PATH`, for example:

```text
C:\Program Files\PostgreSQL\16\bin
```

Restart the terminal after changing `PATH`.

## Environment Files

The project uses separate environment files for the server and client.

### Server Environment

Create `server/.env` from `server/.env.example`.

PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

macOS/Linux/Git Bash:

```bash
cp server/.env.example server/.env
```

Required server values:

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/planorka
JWT_SECRET=replace_with_32_plus_random_characters
JWT_EXPIRES_IN=7d
```

Optional AI values:

```env
OPENAI_API_KEY=your_key_if_using_ai_features
OPENAI_MODEL=gpt-4o-mini
```

### Client Environment

Create `client/.env` from `client/.env.example`.

PowerShell:

```powershell
Copy-Item client/.env.example client/.env
```

macOS/Linux/Git Bash:

```bash
cp client/.env.example client/.env
```

Default local client values:

```env
VITE_API_BASE_URL=/api
VITE_UPLOADS_BASE_URL=
```

`VITE_API_BASE_URL=/api` works with the Vite proxy configuration in `client/vite.config.js`. `VITE_UPLOADS_BASE_URL` can stay blank when uploads are served from the same origin as the frontend.

## Database Setup

Create the local PostgreSQL database:

```bash
createdb -U postgres planorka
```

Enable UUID support:

```bash
psql -U postgres -d planorka -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

Install server dependencies and run migrations:

```bash
cd server
npm install
npm run migrate
```

Run migrations again whenever new SQL files are added to `server/migrations`.

## Install Client Dependencies

```bash
cd client
npm install
```

## Run in Development

Use two terminals.

Terminal 1, API server:

```bash
cd server
npm run dev
```

The server runs on:

```text
http://localhost:5000
```

Health checks:

```text
http://localhost:5000/health
http://localhost:5000/api/ping
```

Terminal 2, frontend:

```bash
cd client
npm run dev
```

The Vite client runs on:

```text
http://localhost:5173
```

## Available Scripts

Server scripts, run from `server/`:

```bash
npm run dev
npm start
npm run migrate
```

The server also contains a placeholder `npm test` script that exits with an error message because automated tests are not configured in `server/package.json`.

Client scripts, run from `client/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## API Notes

All protected API routes require a JWT bearer token:

```http
Authorization: Bearer <token>
```

Main API groups:

- `/api/auth`
- `/api/users`
- `/api/courses`
- `/api/tasks`
- `/api/calendar`
- `/api/activities`
- `/api/friends`
- `/api/messages`
- `/api/chats`
- `/api/notifications`
- `/api/assistant`
- `/api/stats`
- `/uploads`

## Troubleshooting

If login or registration fails, check that:

- the server is running on `http://localhost:5000`;
- the client is running on `http://localhost:5173`;
- `server/.env` contains a valid `DATABASE_URL`;
- `JWT_SECRET` is set;
- migrations have been run.

If AI features fail, check that:

- `OPENAI_API_KEY` is set in `server/.env`;
- `OPENAI_MODEL` is set or allowed to default to `gpt-4o-mini`;
- the server was restarted after changing `.env`.

If the client shows a blank page, run:

```bash
cd client
npm run build
```

Then check the browser console for frontend runtime or API errors.

## Files That Should Not Be Committed

Do not commit local secret or generated files such as:

- `server/.env`
- `client/.env`
- `node_modules/`
- `client/dist/`
- private user upload data
