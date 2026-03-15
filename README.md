# SyncDocs

SyncDocs is a full-stack, passwordless collaborative document editor. It combines OTP-based authentication, role-based sharing, and real-time multi-user editing with live presence and cursor tracking.

## What This Project Includes

- Passwordless sign-in with email OTP
- JWT session handling with access/refresh cookies
- Document ownership + collaborator roles (`owner`, `editor`, `viewer`)
- Real-time collaboration over Socket.IO
- Rich text editing with Lexical (lists, links, tables, code, images, markdown shortcuts)
- Account management (profile updates, avatar upload, account deletion)
- PDF export from the editor UI

## Tech Stack

### Client

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Lexical editor ecosystem
- Axios
- Socket.IO client
- React Router

### Server

- Node.js + Express 5 + TypeScript
- MongoDB + Mongoose
- Socket.IO
- JWT + bcryptjs
- Zod validation
- Nodemailer (OTP emails)
- Cloudinary upload support (avatars)

## Repository Structure

```text
SyncDocs/
	client/   # React app (UI, auth/session handling, dashboard, editor)
	server/   # Express API + Socket.IO collaboration server
```

## Local Development

### Prerequisites

- Node.js 18+ (recommended)
- npm
- MongoDB instance
- SMTP credentials for OTP email delivery
- (Optional but supported) Cloudinary credentials for avatar uploads

### 1) Install Dependencies

From project root:

```bash
cd server
npm install

cd ../client
npm install
```

### 2) Configure Environment Variables

Create a `.env` file in `server/`:

```env
PORT=8000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/syncdocs

JWT_ACCESS_SECRET=replace_with_a_long_random_secret
JWT_REFRESH_SECRET=replace_with_a_long_random_secret

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@example.com

# Cloudinary (required for avatar upload endpoint)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# or upload preset mode
# CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

Create a `.env` file in `client/`:

```env
VITE_API_URL=http://localhost:8000
```

### 3) Run the App

Start backend:

```bash
cd server
npm run dev
```

Start frontend in another terminal:

```bash
cd client
npm run dev
```

Open the client at `http://localhost:5173`.

## Available Scripts

### Client (`client/package.json`)

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and build production assets
- `npm run lint` - run ESLint
- `npm run preview` - preview production build

### Server (`server/package.json`)

- `npm run dev` - run API in watch mode via `tsx`
- `npm run build` - compile TypeScript to `dist/`
- `npm start` - run compiled server from `dist/server.js`

## User Flow

1. User opens landing page and enters email.
2. Backend sends a 6-digit OTP email.
3. User verifies OTP.
4. Server issues `accessToken` and `refreshToken`, sets them as httpOnly cookies.
5. Client fetches current user and unlocks protected routes.
6. User creates/manages documents and collaborates in real time.

## Authentication and Session Model

- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Refresh token is hashed before storage in DB
- Cookies are `httpOnly` and change security behavior by `NODE_ENV`:
	- `development`: `sameSite=lax`, `secure=false`
	- `production`: `sameSite=none`, `secure=true`
- Client Axios interceptor auto-attempts `/auth/refresh` on `401`
- On refresh failure, session is cleared and client redirects to `/`

## Authorization Rules

- `owner`
	- full access
	- can rename and delete document
	- can add/remove collaborators and change collaborator roles
- `editor`
	- can edit document content
	- cannot rename or manage collaborators
- `viewer`
	- read-only

## REST API Overview

Base URL: `VITE_API_URL` (default `http://localhost:8000`)

### Health

- `GET /health`

### Auth

- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `GET /auth/me`
- `PATCH /auth/me`
- `POST /auth/me/avatar`
- `POST /auth/me/upload-avatar`
- `POST /auth/avatar`
- `POST /auth/upload-avatar`
- `POST /auth/logout`
- `DELETE /auth/me`

### Documents

- `POST /documents`
- `GET /documents`
- `GET /documents/owned`
- `GET /documents/shared`
- `GET /documents/:id`
- `PUT /documents/:id`
- `DELETE /documents/:id`
- `POST /documents/:id/collaborators`
- `DELETE /documents/:id/collaborators`
- `DELETE /documents/:id/collaborators/:collaboratorId`
- `PUT /documents/:id/collaborators`
- `PATCH /documents/:id/collaborators/:collaboratorId`

All `/documents/*` routes require authentication.

## Real-Time Collaboration (Socket.IO)

### Client -> Server events

- `document:join` `{ documentId }`
- `document:update` `{ documentId, content }`
- `document:title:update` `{ documentId, title }`
- `cursor:update` `{ documentId, cursor | null }`
- `document:leave` `{} `

### Server -> Client events

- `document:bootstrap`
- `presence:update`
- `document:update`
- `document:title:update`
- `document:saved`
- `document:error`

Realtime saves are debounced on the server (250ms) and increment document version on persistence.

## Data Model Snapshot

### User

- `fullName`
- `username` (unique)
- `email` (unique, sparse)
- `avatar`
- `refreshToken` (hashed, excluded by default)
- `isVerified`

### Document

- `title`
- `content`
- `owner`
- `collaborators[]` with `role` (`editor` or `viewer`)
- `version`
- `isDeleted` (soft delete)
- timestamps

## Important Notes and Constraints

- CORS is currently hardcoded to `http://localhost:5173` in both Express and Socket.IO server setup.
- OTP resend is blocked while an unexpired OTP exists (5-minute window).
- Deleting a document performs soft delete (`isDeleted=true`).
- Deleting an account:
	- soft deletes owned documents
	- removes collaborator entries from shared documents
	- deletes OTP records and user account
- Collaborator invitation expects user email to already exist in the system.
- Title updates are owner-only in both REST and realtime layers.

## Production Considerations

- Replace localhost CORS origin with your deployed frontend URL(s).
- Serve backend over HTTPS so secure cookies can be used with `sameSite=none`.
- Use strong, unique JWT secrets.
- Configure production MongoDB, SMTP, and Cloudinary credentials.
- Consider adding rate limits and monitoring for auth/collaboration endpoints.

## License

ISC
