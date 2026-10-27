# Ztyle Store

Ztyle Store is a single Next.js application. The storefront and backend API are deployed from the repository root as one Vercel project.

## Local development

1. Install Node.js 20.9 or newer and pnpm.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env` and fill in the required values.
4. Start the app with `pnpm dev`.

The storefront runs at `http://localhost:3000`; API endpoints are available under `/api`. Application code lives in `src/`, App Router entry points in `app/`, and static assets in `public/`.

## Vercel deployment

Import this repository as one project and keep **Root Directory** set to `./`. Vercel detects Next.js from the root `package.json`; use the default Next.js build and output settings. Do not import the former `client` and `server` directories as separate applications.

Configure the environment variables listed in `.env.example` in Vercel project settings. Apply the Prisma schema to the configured PostgreSQL database before serving production traffic. `pnpm build` generates Prisma Client and builds the Next.js app.

The API uses Node.js server runtime for Prisma, Express compatibility, email, uploads, and payments.
