-- Demo user para desarrollo local
-- Email:    demo@workoutapp.local
-- Password: demo123456
-- Crea el usuario solo si no existe (idempotente)

DO $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'demo@workoutapp.local';

  IF _uid IS NULL THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at, raw_app_meta_data,
      raw_user_meta_data, created_at, updated_at, confirmation_token,
      email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
      'authenticated', 'authenticated', 'demo@workoutapp.local',
      crypt('demo123456', gen_salt('bf')),
      now(), now(), '{"provider":"email","providers":["email"]}',
      '{}', now(), now(), '', '', '', '')
    RETURNING id INTO _uid;

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (_uid, _uid, format('{"sub":"%s","email":"%s"}', _uid::text, 'demo@workoutapp.local')::jsonb,
      'email', 'demo@workoutapp.local', now(), now(), now());
  END IF;
END $$;
