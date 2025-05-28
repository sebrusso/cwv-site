This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install the dependencies first:

```bash
pnpm install
```

Then run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase Authentication

1. Enable the **Email** provider in your Supabase project.
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
3. Run `pnpm dev` and sign up with an email and password.

## Development Workflow

Use the following commands during development:

```bash
pnpm lint       # check for linting issues
pnpm typecheck  # run TypeScript type checking
pnpm test       # run the test suite
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database Performance

- Added several indexes to frequently queried columns for faster lookups. See `migrations/20240606_add_indexes.sql`.
- Leaderboard API now caches results for one minute and supports pagination via `page` and `pageSize` query parameters.
- Supabase client initialization uses a shared instance to reduce connection overhead.
