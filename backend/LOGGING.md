# Backend logging

Production uses Spring Boot's structured JSON console logging, collected by Railway's Deploy Logs.
The existing controller/service/client/repository architecture remains in place; logging happens
at request, provider and exception boundaries rather than being repeated in every controller.

Every incoming request gets a server-generated `correlationId`, returned in `X-Correlation-Id`.
The same ID is included in synchronous request/provider/error logs and API error responses.

| Event | Meaning | Useful fields |
| --- | --- | --- |
| `http_request_completed` | Backend request finished | method, route template, status, durationMs |
| `provider_request_completed` | HOT HTTP call finished | provider, method, route template, upstreamStatus, outcome, durationMs |
| `provider_schema_mismatch` | HOT JSON does not match the expected mapping | reason, field |
| `api_error` | Known application/provider error returned to the app | status, errorCode |
| `invalid_request` | Request validation failed | exceptionType |
| `unexpected_error` | Unexpected failure | exceptionType, applicationFrames |

Successful requests log at INFO; client rejections/provider failures at WARN; backend 5xx and
schema failures at ERROR. Successful health probes are omitted to reduce noise.
For transport/decode failures, `upstreamStatus=503` is a synthetic classification, not an HTTP
status received from HOT; check `outcome=transport_or_decode_error`.

For a failing balance refresh, search Deploy Logs for `api_error` or `http_request_completed`
with status 502, then search that event's correlationId. A HOT HTTP rejection logs its actual
upstream status. A successful HOT call followed by `provider_schema_mismatch` indicates mapping
needs correction, such as `expected_balance_array` or `required_field_missing`.

Logs intentionally exclude headers, request/response bodies, query strings, concrete path IDs,
credentials, tokens, balances and customer identifiers. Unexpected failures log exception type
and application stack locations without exception messages/causes, which may contain sensitive data.
Do not enable HTTP wire logging or SQL parameter logging to investigate production issues.

Deploy the updated backend revision to Railway, open Deploy Logs and refresh the app to see
these events. Network Logs continue to show Railway's HTTP status/timing independently.

The balance client uses `/account/balance/0` (explicit default account-type parameter).
The live OpenAPI at `https://ssl.hot.co.zw/api/v3/swagger/v3/swagger.json` declares
`/api/v3/account/balance/{AccountTypeId}` with a required integer parameter and a
`BalanceResponse` containing `balances`. The ReadMe reference documents 0 as the default.
Regression tests cover this exact route and the four-account response envelope.
The app now distinguishes balance mapping, provider and session errors and displays a
support correlation reference rather than hiding every cause behind one generic warning.
This route correction still needs validation against an authorized live account after deployment.

Session restore rotates app tokens independently of HOT token expiry. The backend reuses
a valid HOT token and refreshes it after expiry, as described by HOT's refresh reference.
HOT refresh HTTP 400/401 responses map to `401 PROVIDER_AUTH` rather than `502`;
temporary transport/server failures retain their failure classification. The mobile adapter
removes rejected saved credentials on 401 and retains them during temporary outages.
Refresh behavior is covered by mocked service and transport tests; live verification is still required.
