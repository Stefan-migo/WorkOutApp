ALTER TABLE public.exercises
  ADD COLUMN visibility text NOT NULL DEFAULT 'private',
  ADD COLUMN author_name text,
  ADD CONSTRAINT exercises_visibility_check CHECK (visibility IN ('private', 'community')),
  ADD CONSTRAINT exercises_community_author_check CHECK (
    visibility = 'private' OR (
      user_id IS NOT NULL AND author_name IS NOT NULL
      AND char_length(btrim(author_name)) BETWEEN 1 AND 60
    )
  );

CREATE POLICY "Signed-in users can read community exercises"
ON public.exercises FOR SELECT TO authenticated
USING (visibility = 'community' AND user_id IS NOT NULL);
