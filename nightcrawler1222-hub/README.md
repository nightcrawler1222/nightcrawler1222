# nightcrawler1222-hub

Private R6 coaching hub for nightcrawler1222. Built with Next.js 14 (App Router), Firebase Realtime Database, and client-side encryption via libsodium.

## Quick start

1. Install deps
```bash
npm install
```

2. Create `.env.local`
```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Encryption salt used to derive envelope key (not secret, but unique)
NEXT_PUBLIC_SESSION_SALT=set-a-unique-string
```

3. Dev
```bash
npm run dev
```

## Routes
- `/` homepage
- `/chat/[id]` encrypted chat. Use `?role=coach` to join as coach and start timer on first message.

## Deploy
- Vercel: link repo, ensure `app/page.js` exists at root, add env vars above.
