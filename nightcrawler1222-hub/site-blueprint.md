# Private R6 Coaching Website — nightcrawler1222

#### 🎯 1. Homepage (`/`)
- Clean, dark-themed design (`#0f0f0f` background, white text)
- Title: `nightcrawler1222` in green (`#00ff88`)
- Subtitle: "R6 Coach • Streamer • YouTuber"
- Social media grid with:
  - **YouTube**: Embedded video (e.g., `jaPxxzlrhx8`)
  - **TikTok**, **Instagram**, **Discord** links with placeholder images
- Two Ko-fi buttons:
  - `$1 — 5 Min Quick Tip`
  - `$10 — 20 Min 1v1 Coaching`
- Footer with copyright

#### 💬 2. Encrypted Private Chat Room (`/chat/[id]`)
- Dynamic route using Next.js App Router: `app/chat/[id]/page.js`
- Uses **Firebase Realtime Database** to store messages
- Messages are **end-to-end encrypted** using `libsodium-wrappers`
  - Generate a session key when the first message is sent
  - Encrypt before saving to Firebase
  - Decrypt on load
- Messages appear on:
  - **Left side (gray)** for the user
  - **Right side (blue)** for you (nightcrawler1222)
- Auto-scrolls to bottom on new message

#### 🔐 3. User Authentication Flow
- When a user visits `/chat/abc123`:
  - They are prompted to enter their **Discord tag or username**
  - After entering, they join the chat
- When **you** visit `/chat/abc123?role=coach`:
  - No name prompt
  - You see an **"End Chat" button** (red, only visible to you)
  - Timer starts when you reply

#### ⏱️ 4. Session Timer
- A 5-minute or 20-minute timer starts **when you (the coach) send the first message**
- Countdown displays: `⏱️ Session ends in: 4:59`
- When time ends, an alert shows: `"Chat session ended."`

#### 🤖 5. Automation & Payments
- Uses **Ko-fi** for payments
- When someone pays:
  - **Make.com** automation triggers
  - Generates a **unique room ID** (e.g., `nc1222-5min-a1b2c3d4`)
  - Sends the user an email via **Resend** with the chat link
  - Notifies you on **Discord** with the room link and user info
- You join with `?role=coach` to skip name entry

#### 🚀 6. Deployment
- Built with **Next.js 14 (App Router)**
- Hosted on **Vercel** at: `https://nightcrawler1222-hub.vercel.app`
- GitHub repo: `nightcrawler1222-hub`
- Must have correct structure:
  ```
  app/
    page.js
    chat/
      [id]/
        page.js
  lib/
    firebase.js
  package.json
  next.config.js
  ```

#### 🔧 7. Required Files
- `app/layout.js`: Root HTML layout
- `app/error.js`: Client component with `'use client'` and reload button
- `lib/firebase.js`: Firebase config with `db` export
- `package.json` with `next`, `react`, `react-dom`

#### 🛠️ 8. Development Environment
- Created using **Replit → Next.js template** (`replit.com/new/nextjs`)
- Never overwritten by tutorials
- Deployed to Vercel only when `app/page.js` is at root level

---

### 💬 How to Use This Prompt

Save this prompt in a file called `site-blueprint.md` or in a note.

When you want to rebuild the site (with me or anyone else), just say:
> "Here’s my site prompt — recreate it exactly."

And the full system will be rebuilt — no guesswork.