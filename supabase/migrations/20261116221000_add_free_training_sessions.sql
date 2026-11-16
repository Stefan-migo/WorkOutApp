ALTER TABLE public.sessions
  ADD COLUMN title TEXT,
  DROP CONSTRAINT sessions_type_check,
  ADD CONSTRAINT sessions_type_check CHECK (type IN ('workout', 'sequence', 'free'));

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_free_training_check CHECK (
    type <> 'free' OR (
      workout_id IS NULL AND sequence_id IS NULL AND
      title IS NOT NULL AND char_length(btrim(title)) BETWEEN 1 AND 100
    )
  );
