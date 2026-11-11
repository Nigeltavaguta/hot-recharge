ALTER TABLE purchase_intent ADD COLUMN recovery_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE purchase_intent ADD COLUMN next_verification_at timestamptz;
UPDATE purchase_intent SET next_verification_at=updated_at;
CREATE INDEX intent_next_verification ON purchase_intent(state,next_verification_at);
