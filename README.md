# Mixi

Mixi is a social networking platform that allows users to connect, chat in real time, and interact with each other. The project was developed as a practice project to explore modern web development technologies and real-time communication.

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

### Without Docker

```bash
cd backend && npm install && npm run dev    # needs backend/.env with MONGODB_URI and JWT_SECRET
cd frontend && npm install && npm run dev
```

## Frontend TypeScript migration

The frontend is being moved to TypeScript one file at a time. `frontend/tsconfig.json` uses `allowJs`, so `.js/.jsx` and `.ts/.tsx` files work side by side; `checkJs` is off, so untouched JS is not type-checked. Converted files are checked with `strict` mode.

To convert a file:

1. `git mv foo.js foo.ts` (or `.jsx` → `.tsx`).
2. Drop the `.js` extension from imports of that file (`'../lib/foo'`), since `foo.js` no longer exists.
3. Add types until `npm run typecheck` passes. Shared domain types go in `frontend/src/types/`.
4. Run `npm run lint`, `npm test` and `npm run build`.

Next: pages, layouts, `App.jsx` and `main.jsx` (`.jsx` → `.tsx`), then tests. API and socket payload types live in `frontend/src/types/` (`User`, `Message`, `Conversation`, `Post`, `Friend`, and one response type per endpoint in `types/api.ts`); import them with `import type { ... } from '../types'`.

Already converted: all of `lib/` (each function in `lib/api` returns a typed response), `stores/useAuthStore`, all of `hooks/` and all of `components/`. In `catch` blocks use `getErrorMessage(error, fallback)` from `lib/errors.ts`, since `error` is `unknown` in strict mode.

Where things go in `frontend/src`:

- `types/`: API data (`user`, `chat`, `post`, `friend`, `api`, `socket`) plus types shared by several components or hooks (`call`, `ui`: callbacks such as `OpenProfileHandler`, `ChatThread`, `PostActionHandlers`). A `XxxProps` interface stays next to its component.
- `hooks/`: grouped by domain (`auth/`, `chat/`, `profile/`, `post/`), each with an `index.ts`, so imports read `import { useSignIn } from '../hooks/auth'`. `post/usePostList` holds the paginated post list and every post action, used by the home feed and the profile page.
- `lib/`: `api/` (one file per backend area, all re-exported from `lib/api/index.ts`; always import from `lib/api`, because tests mock that path), `chat/`, `format/`, `navigation/`, plus `socket.ts` and `errors.ts` at the top level.
- `components/common/`: pieces reused across sections (`ConfirmDialog`, `SidebarNav`).
- A large component keeps its file and moves its sub-components into a folder named after it, e.g. `chat-comp/ChatHeader.tsx` + `chat-comp/chat-header/`.
