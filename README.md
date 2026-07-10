# Wakeel.AI Agent Store

Production-oriented Arabic RTL marketplace for discovering, subscribing to, administering, and running AI agents. The original dark navy and green Wakeel.AI branding is preserved.

## Stack

- Next.js 14 App Router and TypeScript
- PostgreSQL with Prisma migrations
- NextAuth credentials sessions with bcrypt password hashing and role authorization
- OpenAI Responses API with persistent run history and usage metadata
- Stripe Checkout subscriptions with signed webhooks
- Upstash Redis distributed API rate limiting with a bounded local fallback
- Docker and GitHub Actions

## Local setup

Requirements: Node.js 24, pnpm 11.7, and PostgreSQL 16 (or Docker).

```bash
git clone --branch agent/production-saas https://github.com/moha700m/7-AGENT-NEW.git
cd 7-AGENT-NEW
cp .env.example .env
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

For local PostgreSQL:

```bash
docker compose up -d postgres
```

## Environment variables

Never commit real values. GitHub Actions reads `OPENAI_API_KEY` from repository secrets when a live integration test is added; runtime secrets must also be configured in the deployment platform.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret of at least 32 characters |
| `NEXTAUTH_URL` | Yes | Canonical authentication URL |
| `NEXT_PUBLIC_APP_URL` | Yes in production | Public application URL |
| `ADMIN_EMAILS` | For initial admin | Comma-separated emails promoted when registering |
| `OPENAI_API_KEY` | For agent runs | Existing server-only OpenAI project key |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.4-mini` |
| `STRIPE_SECRET_KEY` | For checkout | Stripe server key |
| `STRIPE_WEBHOOK_SECRET` | For fulfillment | Stripe webhook signing secret |
| `UPSTASH_REDIS_REST_URL` | Recommended | Distributed rate-limit Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | Recommended | Distributed rate-limit Redis token |
| `REQUIRE_DISTRIBUTED_RATE_LIMIT` | Production | Set `true` to fail closed when Redis is absent |

## Commands

```bash
pnpm db:generate   # Generate Prisma Client
pnpm db:validate   # Validate schema
pnpm db:migrate    # Apply committed migrations
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Authentication and administration

Set `ADMIN_EMAILS` before registering the initial administrator. Authorization is verified again in server components and API routes; middleware is not the sole access boundary. Administrators manage agents at `/admin`.

## Stripe

Configure a Stripe webhook targeting:

```text
POST /api/webhooks/stripe
```

Subscribe to `checkout.session.completed` and `customer.subscription.deleted`. Checkout remains unavailable with a safe `503` until Stripe variables are configured.

## OpenAI

Agent execution uses the server-side Responses API. The API key is never sent to the browser. Each request is saved before generation and receives an addressable `/runs/[id]` page. Local builds do not require the key and do not make live API calls.

## Docker deployment

```bash
docker compose up --build
```

The application container runs migrations before startup and exposes a database-aware health check at `/api/health`. For managed platforms, run `pnpm db:migrate` as a release command before starting the application.

## CI/CD

`.github/workflows/ci.yml` installs from the frozen lockfile, validates Prisma, type-checks, lints, tests, and creates a production build on pushes and pull requests. Deployment is intentionally provider-neutral; add platform deployment only after project ownership and production environment credentials are available.

## Security

Security headers, same-origin checks for browser mutations, role checks, validated inputs, password hashing, signed Stripe webhooks, bounded request sizes, and rate limiting are included. See [SECURITY.md](SECURITY.md) for reporting guidance.

Support: `0509955337`

## License

MIT — see [LICENSE](LICENSE).
