CREATE TABLE app_session (
 id varchar(255) PRIMARY KEY, owner varchar(255) NOT NULL,
 access_hash varchar(255) NOT NULL UNIQUE, refresh_hash varchar(255) NOT NULL UNIQUE,
 provider_secret varchar(16384) NOT NULL, user_json varchar(4096) NOT NULL,
 access_expires timestamptz NOT NULL, refresh_expires timestamptz NOT NULL,
 revoked boolean NOT NULL, version bigint NOT NULL DEFAULT 0
);
CREATE INDEX session_owner ON app_session(owner);
CREATE TABLE purchase_quote (
 id varchar(255) PRIMARY KEY, owner varchar(255) NOT NULL, payload varchar(16384) NOT NULL,
 expires_at timestamptz NOT NULL, consumed boolean NOT NULL DEFAULT false
);
CREATE TABLE purchase_intent (
 id varchar(255) PRIMARY KEY, owner varchar(255) NOT NULL, idempotency_key varchar(100) NOT NULL,
 quote_id varchar(255) NOT NULL REFERENCES purchase_quote(id), reference varchar(255) NOT NULL UNIQUE,
 payload varchar(16384) NOT NULL, result_secret varchar(16384), state varchar(255) NOT NULL,
 created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
 session_id varchar(255) REFERENCES app_session(id), version bigint NOT NULL DEFAULT 0,
 UNIQUE(owner,idempotency_key),
 CHECK(state IN ('CREATED','SUBMITTING','PENDING','UNKNOWN','CONFIRMED_SUCCESS','CONFIRMED_FAILURE'))
);
CREATE INDEX intent_owner_history ON purchase_intent(owner,created_at DESC,id DESC);
CREATE INDEX intent_recovery ON purchase_intent(state,updated_at);
CREATE TABLE stub_receipt (reference varchar(255) PRIMARY KEY,result_secret varchar(16384) NOT NULL);
