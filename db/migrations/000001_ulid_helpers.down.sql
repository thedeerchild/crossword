BEGIN;

DELETE FUNCTION generate_ulid;

DELETE FUNCTION parse_ulid;

DELETE FUNCTION ulid_to_uuid;

DELETE FUNCTION uuid_to_ulid;

DROP EXTENSION pgcrypto;

COMMIT;

