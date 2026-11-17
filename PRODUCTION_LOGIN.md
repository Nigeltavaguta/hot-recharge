# Development and production login

Development keeps the existing mobile/password screen and mock data by default.
Production accepts a registered HOT Recharge email or Zimbabwe mobile number and password.
The backend exchanges those credentials at HOT v3 `/identity/login`, stores provider tokens
encrypted, and queries `/account/balance` with that user's bearer token. Passwords are not saved.

## Configure the mobile app

Set these variables in your production build environment (or `.env.local` for a local preview):

```dotenv
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_MODE=live
EXPO_PUBLIC_API_BASE_URL=https://YOUR-DEPLOYED-SPRING-BACKEND
```

The base URL is your deployed Spring backend origin, without `/api`, not the HOT provider URL.
The EAS production profile already selects production/live; supply the actual backend URL
through your build environment. Restart/reload Expo after changing environment settings;
installed apps need a new build or update to receive configuration changes.

For development, use `EXPO_PUBLIC_APP_ENV=development` and `EXPO_PUBLIC_API_MODE=mock`.
The `backend-demo` profile still permits backend stub testing. Production rejects demo sessions.

## Configure the backend

Activate `SPRING_PROFILES_ACTIVE=production`. This profile selects the live HOT client.
Supply `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
and a persistent `APP_CREDENTIAL_ENCRYPTION_KEY` (base64-encoded 32 random bytes), as described
in `backend/README.md`. Set `APP_ALLOWED_ORIGINS` for any deployed web client.
Keep `HOT_TRANSACTIONS_ENABLED=false`.

Deploy the backend before pointing the production app to it. No deployment, real credential
login, or financial transaction is performed by this code change.

## Available account information and limits

- Account ID and email come from the provider login token; a mobile login supplies its mobile number.
- Live stock balances come from HOT, without mock fallback. Unavailable fields stay empty.
- Full names and other profile fields need a documented HOT profile endpoint.
- Activity and token/PIN pages contain records owned by this backend. Existing website history
  and tokens are not imported: no supported list/export endpoint was established in the supplied docs.
- Live purchases remain disabled by the existing backend safeguards pending verified provider
  transaction, fee, customer and token mappings.

Reference: https://hot-api-v3.readme.io/reference/login and
https://hot-api-v3.readme.io/reference/balances.

Before release, validate login, refresh and balances using an authorized HOT account, confirm
the APIUser permissions required by HOT, and obtain their supported history/profile APIs.
