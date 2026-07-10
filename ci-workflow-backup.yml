name: CI
on: { push: { branches: ['**'] }, pull_request: {} }
permissions: { contents: read }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
        env: { DATABASE_URL: postgresql://build:build@localhost:5432/build, NEXTAUTH_SECRET: 01234567890123456789012345678901, OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} }
