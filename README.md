# Skimbox - Email-First X Bookmarks Resurfacer

A minimal email service that sends 5-10 X bookmarks daily with one-tap actions.

## Features

- **Email-first**: No dashboard, just plain text emails
- **OAuth 2.0 PKCE**: Secure X authentication
- **Smart selection**: Weighted algorithm for bookmark diversity
- **One-tap actions**: Pin, hide, pause, snooze, more
- **Timezone aware**: Respects user's local time
- **Production ready**: Security headers, encryption, validation

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Setup database**:
   ```bash
   npm run db:push
   npm run db:generate
   ```

4. **Seed test data** (optional):
   ```bash
   npm run seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

- `DATABASE_URL`: SQLite file path or Postgres URL
- `APP_URL`: Your app URL (e.g., http://localhost:3000)
- `EMAIL_FROM`: From address for emails
- `RESEND_API_KEY`: Resend API key for sending emails
- `HMAC_SECRET`: 32+ character secret for signing links
- `ENCRYPTION_KEY`: Exactly 32 characters for encrypting tokens
- `X_CLIENT_ID`: X API client ID
- `X_CLIENT_SECRET`: X API client secret
- `X_REDIRECT_URI`: OAuth callback URL

## X API Setup

1. Go to [X Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Set redirect URI to `{APP_URL}/api/auth/x/callback`
5. Request scopes: `tweet.read`, `users.read`, `bookmark.read`

## Testing

```bash
npm test
```

## Deployment

Deploy to Vercel:

```bash
vercel
```

The cron job will run daily at 6 AM UTC.

## Architecture

- **Next.js 14** with App Router
- **Prisma** with SQLite (Postgres via DATABASE_URL)
- **Resend** for email delivery
- **Vercel Cron** for daily scheduling
- **AES-256-GCM** for token encryption
- **HMAC-SHA256** for link signing

## Security

- All action links are HMAC signed
- X access tokens encrypted at rest
- Security headers on all responses
- Input validation and sanitization
- Rate limiting on X API calls

## License

MIT
