# Wakeel.AI

Welcome to Wakeel.AI, a smart agent marketplace proudly built in Saudi Arabia.

## Project Structure

This project is a Next.js application with a Prisma/PostgreSQL backend, NextAuth for authentication, and TailwindCSS for styling.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- pnpm (package manager)
- Docker (for local development with PostgreSQL)

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone --branch agent/production-saas https://github.com/moha700m/7-AGENT-NEW.git
    cd 7-AGENT-NEW
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Copy the `.env.example` file to `.env` and fill in the required values.
    ```bash
    cp .env.example .env
    ```

4.  **Start Docker services (PostgreSQL):**
    ```bash
    docker-compose up -d postgres
    ```

5.  **Run Prisma migrations:**
    ```bash
    npx prisma migrate dev --name init
    ```

6.  **Start the development server:**
    ```bash
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Builds the application for production.
- `pnpm start`: Starts the production server.
- `pnpm lint`: Runs ESLint to check for code style issues.
- `pnpm typecheck`: Runs TypeScript compiler to check for type errors.
- `pnpm test`: Runs tests.
- `pnpm prisma generate`: Generates Prisma client.
- `pnpm prisma migrate dev`: Creates and applies new migrations.

## Deployment

This application can be deployed using Docker. A `Dockerfile` and `docker-compose.yml` are provided for containerization.

## CI/CD

Basic CI/CD is configured using GitHub Actions (see `.github/workflows/ci.yml`). It includes steps for linting, type-checking, and building the project.

## Security

- **Secure Headers:** Configured in `next.config.js` and `src/middleware.ts`.
- **API Validation:** Using Zod for input validation in API routes.
- **Rate Limiting:** Implemented in `src/middleware.ts`.

## SEO & Accessibility

- **SEO:** `robots.txt` and `sitemap.xml` are provided in the `public` directory.
- **Accessibility:** Basic `lang` and `dir` attributes are set in `src/app/layout.tsx`.

## Monitoring

- Basic logging utility in `src/lib/logger.ts`.

## Contributing

Feel free to contribute to the project by submitting issues or pull requests.

## License

[MIT License](LICENSE)
