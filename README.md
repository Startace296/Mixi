# Mixi

Mixi is a social networking platform that allows users to connect, chat in real time, and interact with each other. The project was developed as a practice project to explore modern web development technologies and real-time communication.

User demo: solilyoung5@gmail.com
password: LOL292002

## Features

- User Authentication (JWT, Google OAuth)
- Email OTP Verification
- User Profile Management
- Friend Request System
- Real-time Chat with Socket.IO
- Group Chat
- Voice & Video Calling
- Social Posts
- AI-powered Chat Support

## Tech Stack

### Frontend
- ReactJS
- TypeScript (incremental migration from JS)
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Socket.IO

### Database
- MongoDB

### Others
- Docker
- GitHub Actions
- Google Gemini API

## Installation

```bash
git clone https://github.com/Startace296/Mixi.git
cd Mixi
docker compose up --build
```

Then open:

| Service  | URL                                   |
| -------- | ------------------------------------- |
| Frontend | http://localhost:3000                 |
| Backend  | http://localhost:5000                 |
| MongoDB  | internal to Docker (`mongo-data` volume) |

Only Docker is required. To enable optional features (email OTP, image upload, AI chat, Google login, TURN for calls) or change ports, copy `.env.example` to `.env` in the repo root and fill in the values, then rerun `docker compose up --build`.

Stop with `docker compose down` (add `-v` to also wipe the database).

If a port is already taken (for example a backend started with `npm run dev` holds 5000), pick other ones and rebuild, since the frontend bakes the backend URL in at build time:

```bash
BACKEND_PORT=8055 FRONTEND_PORT=3033 docker compose up --build
```

### Without Docker

```bash
cd backend && npm install && npm run dev    # needs backend/.env with MONGODB_URI and JWT_SECRET
cd frontend && npm install && npm run dev
```

## CI/CD and deployment

- `.github/workflows/pr-checks.yml` runs on every pull request into `main`: backend lint and tests, frontend lint, type check, tests and build. It never deploys.
- `.github/workflows/ci.yml` runs on every push to `main`: backend tests and frontend lint, then builds both images and pushes them to Docker Hub. The frontend image gets `VITE_API_URL=http://<EC2_HOST>:5000` at build time.
- `.github/workflows/cd.yml` runs after a successful CI run: it SSHes into the EC2 host and runs `docker compose pull && docker compose up -d` in `~/app`.

`docker-compose.prod.yml` is the production stack (prebuilt images, no MongoDB container, settings from `backend/.env`). On the server it is used as `~/app/docker-compose.yml`. `docker-compose.yml` is the local stack described above.

Voice calls need the page to be served over HTTPS (or from `localhost`): browsers only allow microphone access in a secure context. On a plain `http://<EC2_HOST>` deployment calls cannot start.

## Frontend TypeScript

All of `frontend/src` is TypeScript (strict mode). Tests under `frontend/tests` are still JavaScript; `tsconfig.json` keeps `allowJs` on (with `checkJs` off) so they keep running unchanged. Before pushing, run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`.

API and socket payload types live in `frontend/src/types/` (`User`, `Message`, `Conversation`, `Post`, `Friend`, and one response type per endpoint in `types/api.ts`); import them with `import type { ... } from '../types'`. In `catch` blocks use `getErrorMessage(error, fallback)` from `lib/errors.ts`, since `error` is `unknown` in strict mode. What `MainLayout` passes to its child routes is typed as `MainOutletContext` (read it with `useOutletContext<MainOutletContext>()`).

Where things go in `frontend/src`:

- `types/`: API data (`user`, `chat`, `post`, `friend`, `api`, `socket`) plus types shared by several components or hooks (`call`, `ui`: callbacks such as `OpenProfileHandler`, `ChatThread`, `PostActionHandlers`). A `XxxProps` interface stays next to its component.
- `hooks/`: grouped by domain (`auth/`, `chat/`, `profile/`, `post/`), each with an `index.ts`, so imports read `import { useSignIn } from '../hooks/auth'`. `post/usePostList` holds the paginated post list and every post action, used by the home feed and the profile page.
- `lib/`: `api/` (one file per backend area, all re-exported from `lib/api/index.ts`; always import from `lib/api`, because tests mock that path), `chat/`, `format/`, `navigation/`, plus `socket.ts` and `errors.ts` at the top level.
- `components/common/`: pieces reused across sections (`ConfirmDialog`, `SidebarNav`).
- A large component keeps its file and moves its sub-components into a folder named after it, e.g. `chat-comp/ChatHeader.tsx` + `chat-comp/chat-header/`.
