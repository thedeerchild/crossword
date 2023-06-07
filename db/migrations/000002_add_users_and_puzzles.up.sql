BEGIN;
CREATE TABLE puzzles(
  -- IDs
  id uuid DEFAULT generate_ulid() PRIMARY KEY,
  -- author_id REFERENCES users(id),
  -- Data
  name text UNIQUE NOT NULL,
  grid text NOT NULL,
  answers jsonb NOT NULL,
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  published_at timestamp with time zone
);

CREATE TABLE enum_directions(
  value text PRIMARY KEY
);

INSERT INTO enum_directions
  VALUES ('across'),
('down');

CREATE TABLE clues(
  -- IDs
  id uuid DEFAULT generate_ulid() PRIMARY KEY,
  puzzle_id uuid REFERENCES puzzles(id),
  -- Data
  direction text REFERENCES enum_directions(value) NOT NULL,
  label integer NOT NULL,
  value text NOT NULL
);

COMMIT;

