# Contributing to SmartProcure

Thank you for contributing to SmartProcure — Farm Gate to Payment (SIH 2026).

---

## 1. Branching Strategy

We follow Git Flow conventions with structured branch naming:

- **`main`**: Production-ready code.
- **`develop`**: Integration branch for upcoming releases.
- **`feature/*`**: New feature development (e.g., `feature/project-foundation`, `feature/auth`, `feature/farmer`).
- **`fix/*`**: Bug fixes for active issues (e.g., `fix/booking-concurrency`).
- **`test/*`**: Test additions or framework updates (e.g., `test/queue-e2e`).
- **`docs/*`**: Documentation changes (e.g., `docs/api-versioning`).
- **`release/*`**: Pre-release stability testing.

---

## 2. Commit Message Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/).

### Format:

`<type>(<scope>): <short summary>`

### Allowed Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Infrastructure, dependency, or build system updates

### Examples:

- `feat(auth): add authentication foundation`
- `feat(queue): implement priority queue ordering`
- `fix(booking): prevent duplicate slot booking`
- `test(queue): add queue ordering integration tests`
- `docs(api): document booking health endpoints`
- `refactor(db): improve transaction handling helper`

---

## 3. Pull Request Guidelines

1. **Base Branch**: Target `develop` for all new features and bug fixes.
2. **Branch Hygiene**: Rebase onto `develop` before opening a Pull Request.
3. **Automated Checks**: PRs must pass all automated CI steps:
   - Dependency installation
   - ESLint check (`npm run lint`)
   - Type check (`npm run dev` or build validation)
   - Unit & Integration tests (`npm run test`)
   - Build compilation (`npm run build`)
4. **Code Review**: At least one approved review from a core developer is required.

---

## 4. Local Development Requirements

Before submitting code:

- Run `npm run lint` and `npm run format:check`.
- Ensure database migrations run cleanly (`npm run db:migrate`).
- Ensure unit and integration tests pass cleanly (`npm run test`).
- Verify no secrets or credentials are included in commits or `.env` files.
