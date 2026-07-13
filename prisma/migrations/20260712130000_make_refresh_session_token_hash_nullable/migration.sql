-- The session must exist before its JWT can include the generated session id.
DROP INDEX IF EXISTS "RefreshTokenSession_tokenHash_key";

ALTER TABLE "RefreshTokenSession"
ALTER COLUMN "tokenHash" DROP NOT NULL;
