-- Convert TypeORM postgres enums to varchar (dev / synchronize friendly)

UPDATE activity_logs
SET type = 'artist_registered'
WHERE type::text = 'artist_pending';

ALTER TABLE activity_logs
  ALTER COLUMN type TYPE varchar(64) USING type::text;

ALTER TABLE users
  ALTER COLUMN "verificationStatus" TYPE varchar(32) USING "verificationStatus"::text;

ALTER TABLE users
  ALTER COLUMN "verificationStatus" SET DEFAULT 'pending';

DROP TYPE IF EXISTS activity_logs_type_enum CASCADE;
DROP TYPE IF EXISTS users_verificationstatus_enum CASCADE;
