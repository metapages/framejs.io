CREATE TABLE "public"."frames" ("id" uuid NOT NULL DEFAULT uuidv7(), "created_at" timestamptz NOT NULL DEFAULT now(), "user" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("user") REFERENCES "auth"."users"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("id"));COMMENT ON TABLE "public"."frames" IS E'Reference to a frameio.js item';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
