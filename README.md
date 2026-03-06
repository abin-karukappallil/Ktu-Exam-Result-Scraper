# KTU Exam Result Scraper

A modern, secure web application built with **Next.js 15**, **tRPC**, and **Cheerio** that fetches semester results from the official KTU (APJ Abdul Kalam Technological University) Academic Portal — but **faster, cleaner, and more usable**.

> **⚠️ Disclaimer:** This tool does **not** store any credentials or personal data. All login requests are proxied server-side and discarded after the session ends. This project is not affiliated with KTU.

---

## 🆚 Why This Over the Official KTU Portal?

| Feature | KTU Portal (`app.ktu.edu.in`) | This App |
|---|---|---|
| **Speed** | 8–15s page loads, frequent timeouts | 2–4s end-to-end (login + scrape + render) |
| **UI/UX** | 2008-era Java JSP pages, no mobile support | Modern responsive UI, dark mode, works on all devices |
| **Session Handling** | Session expires every few minutes, forces re-login | Session cached for 10 min, auto-reuses silently |
| **Error Messages** | Generic Java stack traces or blank pages | Clear, human-readable error messages |
| **SSL** | Broken/misconfigured TLS certificates | Handled transparently server-side |
| **Result View** | Cluttered table with 15+ unnecessary columns | Clean table with only what matters: code, name, credits, grade |
| **Grade Visualization** | None | Color-coded grades + performance matrix bar |
| **Accessibility** | Poor contrast, no keyboard nav | Proper labels, focus rings, semantic HTML |
| **API Abuse Protection** | None (open endpoints) | HMAC-signed tokens + rate limiting |
| **Credential Storage** | Session cookies with long TTL | Zero persistence — nothing saved, ever |

### The Core Problem with KTU Portal

1. **It's painfully slow** — Built on legacy Java/Spring, hosted behind AWS load balancers that frequently drop connections
2. **Sessions expire constantly** — You login, navigate to results, and get "Session Expired" — back to login
3. **The UI is hostile** — Tiny fonts, broken layouts on mobile, no dark mode, confusing navigation
4. **SSL issues** — The portal's TLS certificate chain is misconfigured, causing browser warnings
5. **No API** — Everything is server-rendered HTML with form submissions

This app solves all of that by acting as a **smart proxy** — it logs in on your behalf, scrapes the result HTML, parses it with Cheerio, and returns clean JSON to a modern React frontend.

---

## ✨ Features

### 🔐 Secure Authentication Flow
- Credentials are sent over HTTPS and only used server-side to authenticate with KTU
- No database — nothing is persisted
- HMAC-signed short-lived API tokens prevent unauthorized API usage
- Rate limiting (5 requests/minute per IP) blocks brute-force and abuse

### 🛡️ API Protection
- **Token system** — Frontend fetches a signed token on page load; every mutation requires it via `x-api-token` header
- **HMAC-SHA256 signed tokens** with 5-minute TTL — cannot be forged without the server secret
- **Per-IP rate limiter** — In-memory request throttling
- **curl/Postman abuse prevention** — External callers cannot replicate the token handshake

### ⚡ Session Caching
- After successful login, the KTU session is cached in-memory for **10 minutes**
- Subsequent requests with same credentials reuse the cached session
- Cached sessions are validated before reuse — expired sessions trigger fresh login automatically

### 🎨 Modern UI
- Clean, minimal design with **Tailwind CSS v4**
- Responsive two-column layout (form + results)
- Dark mode support with system preference detection
- Skeleton loading states and smooth animations
- Grade-based color coding (S/A+ → emerald/blue, F → red with pulse)
- Performance matrix visualization bar

### 📊 Result Display
- Course code, course name, credits, and grade in a clean table
- Total credits and course count summary badges
- Per-course performance bar chart
- Empty state and error handling with clear messaging

---

## 🚀 Getting Started

### Prerequisites

- **Bun** ≥ 1.0 ([install](https://bun.sh))

```bash
# Install bun (if not already installed)
curl -fsSL https://bun.sh/install | bash
```

### Installation

```bash
git clone https://github.com/your-username/ktuscraper.git
cd ktuscraper
bun install
```

### Environment Variables

Create a `.env.local` file:

```env
# Required for token security in production
# Auto-generated if missing, but set this for consistent behavior across deploys
API_TOKEN_SECRET=your-random-secret-string-here
```

Generate a secure secret:

```bash
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Development

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
bun run build
bun run start
```

### Linting

```bash
bun run lint
```

---

## 🔧 Tech Stack

| Layer         | Technology                           |
| ------------- | ------------------------------------ |
| Runtime       | Bun                                  |
| Framework     | Next.js 15 (App Router)              |
| API Layer     | tRPC v11                             |
| Data Fetching | TanStack React Query                 |
| HTTP Client   | undici (bypasses KTU's broken TLS)   |
| HTML Parsing  | Cheerio                              |
| Styling       | Tailwind CSS v4                      |
| Icons         | Lucide React                         |
| Validation    | Zod                                  |
| Serialization | SuperJSON                            |
| Deployment    | Vercel                               |

---

## 🔒 Security Model

### Token Lifecycle

```
Page Load
  │
  ├── GET  getToken (publicProcedure)
  │   └── Returns: { token: "nonce.expiry.hmac", expiresAt }
  │
  ├── setApiToken(token) → stored in module-level variable
  │   (NOT localStorage — survives only during tab session)
  │
  ├── Auto-refreshes every 4 minutes (token TTL = 5 min)
  │
  └── Every mutation includes header: x-api-token: "nonce.expiry.hmac"
        │
        └── protectedProcedure verifies:
            1. HMAC signature matches (server secret)
            2. Token has not expired
            3. IP is not rate-limited
```

### Why curl/Postman Abuse is Prevented

| Attack Vector | Defense |
|---|---|
| Direct API call without token | `FORBIDDEN` — token required |
| Forged token | HMAC-SHA256 — needs server secret to forge |
| Stolen token | 5-minute TTL — limited window |
| Brute force | 5 req/min per IP rate limit |
| Replay from different IP | Rate limit applies per IP independently |
| Scraping the token endpoint | Token alone is useless without valid KTU credentials |

### What is NOT Stored

| Data | Stored? |
|---|---|
| Passwords | ❌ Used once, discarded |
| Student results | ❌ Returned to client, never persisted |
| Session cookies | ⏱️ In-memory cache, 10 min TTL, lost on redeploy |
| API tokens | ❌ Stateless HMAC verification |
| Request logs | ❌ No database, no analytics |

---

## 📖 Usage

1. Open the app in your browser
2. Enter your **KTU Portal username** (e.g., `SJC23CC006`)
3. Enter your **KTU Portal password**
4. Select the **semester** (S1–S8)
5. *(Optional)* Enter a student ID if checking another student's results
6. Click **Get Results**
7. View your grades, total credits, and performance matrix

### First Request vs Cached

- **First request** (~3–5s): Full login flow (3 HTTP calls to KTU) + scrape
- **Subsequent requests** (~1–2s): Cached session reused, only 1 HTTP call to KTU

---

## 🐛 Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| "Invalid or expired request token" | API token expired | Refresh the page |
| "Rate limit exceeded" | Too many requests | Wait 60 seconds |
| "Login failed" | Wrong credentials | Verify at [app.ktu.edu.in](https://app.ktu.edu.in) |
| "Invalid or expired session" | Cached session went stale | Retry (auto re-logins) |
| "No records found" | Semester has no published results | Try a different semester |
| Blank course names | KTU changed their HTML structure | Check server logs, open an issue |
| "Could not extract CSRF token" | KTU portal is down | Try again later |
| Timeout errors | KTU portal is slow/unresponsive | Retry in a few minutes |

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard → Settings → Environment Variables:

| Variable | Value | Required |
|---|---|---|
| `API_TOKEN_SECRET` | Random 64-char hex string | ✅ Yes |

Generate:

```bash
bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Self-Hosted

```bash
bun run build
PORT=3000 bun run start
```

> **Note:** In-memory rate limiting and session caching reset on serverless cold starts. For production-grade rate limiting, consider [Upstash Redis](https://upstash.com) or [Vercel KV](https://vercel.com/storage/kv).

---

## 🛠️ Development Commands

```bash
bun dev          # Start dev server with hot reload
bun run build    # Production build
bun run start    # Start production server
bun run lint     # Run ESLint
bun test         # Run tests (if configured)
```

---

## 📜 License

MIT — Use at your own risk. Not affiliated with KTU.

