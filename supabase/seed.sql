-- Seed exercises: public exercises visible to all authenticated users (user_id IS NULL)

INSERT INTO exercises (user_id, name, description, category, primary_muscles, secondary_muscles, equipment, difficulty, force, mechanic, source) VALUES
(NULL, 'Push-up', 'Classic bodyweight chest exercise', 'strength', ARRAY['chest', 'triceps'], ARRAY['shoulders', 'core'], ARRAY['bodyweight'], 'beginner', 'push', 'compound', 'system'),
(NULL, 'Pull-up', 'Upper body pulling exercise', 'strength', ARRAY['back', 'biceps'], ARRAY['shoulders', 'core'], ARRAY['pull-up bar'], 'intermediate', 'pull', 'compound', 'system'),
(NULL, 'Squat', 'Fundamental lower body exercise', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['hamstrings', 'core', 'calves'], ARRAY['bodyweight'], 'beginner', 'push', 'compound', 'system'),
(NULL, 'Deadlift', 'Full body compound lift', 'strength', ARRAY['hamstrings', 'glutes', 'back'], ARRAY['core', 'forearms', 'traps'], ARRAY['barbell'], 'intermediate', 'pull', 'compound', 'system'),
(NULL, 'Bench Press', 'Upper body pushing exercise', 'strength', ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['barbell'], 'intermediate', 'push', 'compound', 'system'),
(NULL, 'Overhead Press', 'Standing shoulder press', 'strength', ARRAY['shoulders', 'triceps'], ARRAY['core', 'upper chest'], ARRAY['dumbbell'], 'intermediate', 'push', 'compound', 'system'),
(NULL, 'Barbell Row', 'Horizontal pulling exercise', 'strength', ARRAY['back', 'biceps'], ARRAY['shoulders', 'core'], ARRAY['barbell'], 'intermediate', 'pull', 'compound', 'system'),
(NULL, 'Plank', 'Core stability hold', 'strength', ARRAY['core'], ARRAY['shoulders', 'glutes'], ARRAY['bodyweight'], 'beginner', 'hold', 'isometric', 'system'),
(NULL, 'Lunge', 'Single leg lower body exercise', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['hamstrings', 'calves', 'core'], ARRAY['bodyweight'], 'beginner', 'push', 'compound', 'system'),
(NULL, 'Burpee', 'Full body cardio exercise', 'cardio', ARRAY['full body'], ARRAY['chest', 'legs', 'core'], ARRAY['bodyweight'], 'intermediate', 'push', 'compound', 'system'),
(NULL, 'Glute Bridge', 'Hip thrust variation for glutes', 'strength', ARRAY['glutes', 'hamstrings'], ARRAY['core', 'lower back'], ARRAY['bodyweight'], 'beginner', 'push', 'compound', 'system'),
(NULL, 'Dumbbell Curl', 'Isolated bicep exercise', 'strength', ARRAY['biceps'], ARRAY['forearms'], ARRAY['dumbbell'], 'beginner', 'pull', 'isolation', 'system'),
(NULL, 'Tricep Dip', 'Bodyweight tricep extension', 'strength', ARRAY['triceps'], ARRAY['chest', 'shoulders'], ARRAY['bodyweight'], 'beginner', 'push', 'compound', 'system'),
(NULL, 'Jumping Jack', 'Full body cardio movement', 'cardio', ARRAY['full body'], ARRAY['legs', 'shoulders'], ARRAY['bodyweight'], 'beginner', 'push', 'compound', 'system'),
(NULL, 'Mountain Climber', 'Dynamic core and cardio exercise', 'cardio', ARRAY['core', 'shoulders'], ARRAY['hip flexors', 'legs'], ARRAY['bodyweight'], 'intermediate', 'push', 'compound', 'system'),
(NULL, 'Romanian Deadlift', 'Hinge-focused hamstring exercise', 'strength', ARRAY['hamstrings', 'glutes'], ARRAY['lower back', 'core'], ARRAY['dumbbell'], 'intermediate', 'pull', 'compound', 'system'),
(NULL, 'Lat Pulldown', 'Vertical pulling machine exercise', 'strength', ARRAY['back', 'biceps'], ARRAY['shoulders'], ARRAY['cable'], 'beginner', 'pull', 'compound', 'system'),
(NULL, 'Leg Press', 'Machine-based leg exercise', 'strength', ARRAY['quadriceps', 'glutes'], ARRAY['hamstrings', 'calves'], ARRAY['machine'], 'beginner', 'push', 'compound', 'system'),
(NULL, 'Chest Fly', 'Isolation chest exercise', 'strength', ARRAY['chest'], ARRAY['shoulders'], ARRAY['dumbbell'], 'intermediate', 'push', 'isolation', 'system'),
(NULL, 'Russian Twist', 'Rotational core exercise', 'strength', ARRAY['core', 'obliques'], ARRAY['hip flexors'], ARRAY['bodyweight'], 'beginner', 'twist', 'isolation', 'system')
ON CONFLICT DO NOTHING;
