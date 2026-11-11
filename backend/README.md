# HOT Recharge backend

Java integration layer for the existing Expo mobile application. It provides app sessions, account balances, product discovery, purchase quotes, airtime/data/ZESA/payment flows, transaction recovery and a token/PIN vault.

## Stack and structure

- Java 21, Spring Boot 3.5.16 and Maven Wrapper.
- Spring Web, Security, Validation and Actuator.
- PostgreSQL, Spring Data JPA and Flyway migrations.
- JUnit, Mockito and PostgreSQL Testcontainers tests.

Requests follow `controller -> service -> client`. Repositories store application-owned sessions, quotes, purchase intents and encrypted results. HOT remains authoritative for real balances.

Source packages live in `src/main/java/com/hotrecharge/app/`: `controller`, `service`, `client`, `dto`, `model`, `entity`, `repository`, `security`, `config`, `exception` and `util`. Database migrations live in `src/main/resources/db/migration/`.

## Provider modes

`HOT_CLIENT_MODE=stub` is the default. It uses simulated accounts, balances, purchases, tokens and PINs without contacting HOT. Sign in with a valid Zimbabwe mobile number and password `demo-password`. Responses identify demonstration data.

`HOT_CLIENT_MODE=live` selects the official HTTPS client. Real provider schemas and account behavior still require verification. `HOT_TRANSACTIONS_ENABLED=false` remains the default; this release also rejects enabling live purchases until the outstanding mappings and safety gates are reviewed. Live mode never falls back to simulation.

## Local setup

Install Java 21 and PostgreSQL, or use Docker for the database. Run the following from `backend/` in PowerShell:

```powershell
Copy-Item .env.example .env
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/hotrecharge'
$env:SPRING_DATASOURCE_USERNAME = 'hotrecharge'
$env:SPRING_DATASOURCE_PASSWORD = 'replace-with-your-local-password'
$keyBytes = New-Object byte[] 32
$keyGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$keyGenerator.GetBytes($keyBytes)
$keyGenerator.Dispose()
$env:APP_CREDENTIAL_ENCRYPTION_KEY = [Convert]::ToBase64String($keyBytes)
$env:HOT_CLIENT_MODE = 'stub'
$env:HOT_TRANSACTIONS_ENABLED = 'false'
```

Keep the encryption key securely for subsequent runs against the same database; generating a different key makes existing encrypted records unreadable. Never commit it. Spring does not automatically load `.env`; export variables into the application process or configure your launcher to load them.

Create a database named `hotrecharge` owned by the configured user. Alternatively, start the included PostgreSQL container using the password exported above:

```powershell
docker compose up -d
```

Start the backend:

```powershell
.\mvnw.cmd spring-boot:run
```

The default port is `8080`, overridden by `PORT`. Readiness is available at `/actuator/health/readiness`. Flyway applies migrations at startup.

## API surface

All paths below are our backend routes, not upstream HOT endpoints. Protected routes require `Authorization: Bearer <app-access-token>`.

| Area | Routes |
|---|---|
| Authentication | POST `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` |
| Registration handoff | POST `/api/auth/register` returns the official website handoff; it does not create an account |
| Account | GET `/api/account`, `/api/account/balances` |
| Catalogue | GET `/api/networks`, `/api/products`, `/api/products/{id}`, `/api/products/{id}/stock`, `/api/payments/services` |
| ZESA customer check | POST `/api/zesa/validate` |
| Quotes | POST `/api/quotes` |
| Purchases | POST `/api/recharge/airtime`, `/api/recharge/data`, `/api/recharge/zesa`, `/api/payments` |
| Transactions | GET `/api/transactions`, `/api/transactions/{id}`; POST `/api/transactions/{id}/verify` |
| Recovery | GET `/api/purchase-intents/{key}` |
| Vault | GET `/api/vault/tokens` |

Purchases require an owned, unexpired quote and an `Idempotency-Key`. The original reference and intent are persisted before dispatch. Pending or uncertain purchases are verified by reference, never automatically submitted again. Success is returned only after confirmation; sensitive provider tokens and result artifacts are encrypted at rest.

## Tests and builds

```powershell
.\mvnw.cmd -B verify
```

On Linux/macOS, use `./mvnw -B verify`. The executable output is `target/hot-recharge-backend.jar`.

Portable service tests use H2; the PostgreSQL migration test uses Testcontainers when Docker is available. To test service flows and migrations against native PostgreSQL, set `TEST_DATABASE_URL`, `TEST_DATABASE_USER` and `TEST_DATABASE_PASSWORD` to a **disposable test database**. The tests clear its application records. Never use a real application database.

The implementation was verified with 21 passing backend tests against isolated PostgreSQL, frontend HTTP smoke tests and an actual backend restart recovery drill. No real HOT purchases were tested. Docker image deployment, APK signing and physical-device validation remain outstanding.

## Frontend and hosting

The frontend defaults to its local mock service. To use this backend, set `EXPO_PUBLIC_API_MODE=live` and `EXPO_PUBLIC_API_BASE_URL` to the backend's trusted HTTPS origin, without `/api`. The backend can still use its stub provider; demonstration responses remain labelled.

Railway preparation is included in `Dockerfile`, `.dockerignore` and `railway.json`. Configure the service root as `/backend`, supply private PostgreSQL credentials and the encryption key, and retain the disabled live-purchase gate. The production profile enables structured JSON logging. No hosting deployment has been performed.
