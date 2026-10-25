This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment variables

Configure these variables in `.env.local` for local development and in the
deployment environment for production:

- `MONGODB_URI` — MongoDB connection string.
- `NEXTAUTH_SECRET` — secret used to sign and encrypt authentication sessions.
- `NEXTAUTH_URL` — canonical application URL used by NextAuth.
- `GEMINI_API_KEY` — server-side Gemini API key. Do not expose it to browser code.
- `GEMINI_MODEL` — Gemini model identifier available to the configured account.
- `RATE_LIMIT_TRUSTED_IP_HEADER` — set this when the production request adapter does not provide a server-derived IP. Configure it to a header name that trusted ingress overwrites with exactly one client IP, after removing any client-supplied value. The application does not trust `X-Forwarded-For` implicitly. In local development only, requests without an IP use a shared loopback rate-limit bucket; in production, missing or invalid trusted IP configuration fails closed. Registration returns a sanitized `503` configuration message in that case.

Keep secret values out of source control. `.env*` files are ignored by the
repository's `.gitignore`; configure production values in the hosting provider's
secret manager.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
