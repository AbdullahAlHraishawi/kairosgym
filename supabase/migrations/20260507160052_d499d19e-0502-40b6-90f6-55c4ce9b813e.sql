
-- 1. Extension for trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. New columns
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS secondary_muscles text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'Beginner',
  ADD COLUMN IF NOT EXISTS exercise_type text NOT NULL DEFAULT 'Compound',
  ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slug text;

-- 3. Backfill slug for any existing rows
UPDATE public.exercises
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

ALTER TABLE public.exercises
  ALTER COLUMN slug SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exercises_slug_key'
  ) THEN
    ALTER TABLE public.exercises ADD CONSTRAINT exercises_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS exercises_muscle_group_idx ON public.exercises(muscle_group);
CREATE INDEX IF NOT EXISTS exercises_equipment_idx ON public.exercises(equipment);
CREATE INDEX IF NOT EXISTS exercises_exercise_type_idx ON public.exercises(exercise_type);
CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx ON public.exercises USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS exercises_aliases_gin_idx ON public.exercises USING gin (aliases);

-- 5. Seed: idempotent upsert by slug
INSERT INTO public.exercises (slug, name, muscle_group, equipment, secondary_muscles, difficulty, exercise_type, aliases) VALUES
-- ============== CHEST ==============
('bench-press','Bench Press','Chest','Barbell',ARRAY['Triceps','Shoulders'],'Intermediate','Compound',ARRAY['bp','bench','flat bench']),
('incline-bench-press','Incline Bench Press','Chest','Barbell',ARRAY['Shoulders','Triceps'],'Intermediate','Compound',ARRAY['incline bench','incline bp']),
('decline-bench-press','Decline Bench Press','Chest','Barbell',ARRAY['Triceps'],'Intermediate','Compound',ARRAY['decline bench']),
('close-grip-bench-press','Close-Grip Bench Press','Chest','Barbell',ARRAY['Triceps'],'Intermediate','Compound',ARRAY['cgbp','close grip']),
('dumbbell-bench-press','Dumbbell Bench Press','Chest','Dumbbell',ARRAY['Triceps','Shoulders'],'Beginner','Compound',ARRAY['db bench','db press']),
('incline-dumbbell-press','Incline Dumbbell Press','Chest','Dumbbell',ARRAY['Shoulders','Triceps'],'Beginner','Compound',ARRAY['incline db press']),
('decline-dumbbell-press','Decline Dumbbell Press','Chest','Dumbbell',ARRAY['Triceps'],'Beginner','Compound',ARRAY['decline db press']),
('dumbbell-fly','Dumbbell Fly','Chest','Dumbbell',ARRAY['Shoulders'],'Beginner','Isolation',ARRAY['db fly','flyes']),
('incline-dumbbell-fly','Incline Dumbbell Fly','Chest','Dumbbell',ARRAY['Shoulders'],'Beginner','Isolation',ARRAY['incline fly']),
('cable-fly','Cable Fly','Chest','Cable',ARRAY['Shoulders'],'Beginner','Isolation',ARRAY['cable crossover','crossover']),
('low-cable-fly','Low Cable Fly','Chest','Cable',ARRAY['Shoulders'],'Beginner','Isolation',ARRAY['low fly']),
('high-cable-fly','High Cable Fly','Chest','Cable',ARRAY['Shoulders'],'Beginner','Isolation',ARRAY['high fly']),
('pec-deck','Pec Deck','Chest','Machine',ARRAY['Shoulders'],'Beginner','Isolation',ARRAY['machine fly','pec dec']),
('chest-press-machine','Chest Press Machine','Chest','Machine',ARRAY['Triceps','Shoulders'],'Beginner','Compound',ARRAY['machine press','machine bench']),
('incline-chest-press-machine','Incline Chest Press Machine','Chest','Machine',ARRAY['Shoulders','Triceps'],'Beginner','Compound',ARRAY['incline machine press']),
('smith-bench-press','Smith Machine Bench Press','Chest','Smith',ARRAY['Triceps','Shoulders'],'Beginner','Compound',ARRAY['smith bench','smith bp']),
('smith-incline-press','Smith Machine Incline Press','Chest','Smith',ARRAY['Shoulders','Triceps'],'Beginner','Compound',ARRAY['smith incline']),
('push-up','Push-Up','Chest','Bodyweight',ARRAY['Triceps','Shoulders','Core'],'Beginner','Compound',ARRAY['pushup','push ups']),
('incline-push-up','Incline Push-Up','Chest','Bodyweight',ARRAY['Triceps','Shoulders'],'Beginner','Compound',ARRAY['incline pushup']),
('decline-push-up','Decline Push-Up','Chest','Bodyweight',ARRAY['Shoulders','Triceps'],'Intermediate','Compound',ARRAY['decline pushup']),
('dip-chest','Chest Dip','Chest','Bodyweight',ARRAY['Triceps','Shoulders'],'Intermediate','Compound',ARRAY['dips','chest dips']),
('svend-press','Svend Press','Chest','Dumbbell',ARRAY['Shoulders'],'Beginner','Isolation',ARRAY[]::text[]),

-- ============== BACK ==============
('deadlift','Deadlift','Back','Barbell',ARRAY['Glutes','Legs','Forearms','Core'],'Advanced','Compound',ARRAY['dl','conventional deadlift']),
('sumo-deadlift','Sumo Deadlift','Back','Barbell',ARRAY['Glutes','Legs'],'Advanced','Compound',ARRAY['sumo dl']),
('barbell-row','Barbell Row','Back','Barbell',ARRAY['Arms','Shoulders'],'Intermediate','Compound',ARRAY['bb row','bent over row','bor']),
('pendlay-row','Pendlay Row','Back','Barbell',ARRAY['Arms','Shoulders'],'Intermediate','Compound',ARRAY['pendlay']),
('t-bar-row','T-Bar Row','Back','Barbell',ARRAY['Arms','Shoulders'],'Intermediate','Compound',ARRAY['tbar row']),
('dumbbell-row','Dumbbell Row','Back','Dumbbell',ARRAY['Arms','Shoulders'],'Beginner','Compound',ARRAY['db row','one arm row']),
('chest-supported-row','Chest-Supported Row','Back','Dumbbell',ARRAY['Arms','Shoulders'],'Beginner','Compound',ARRAY['chest supported row']),
('seated-cable-row','Seated Cable Row','Back','Cable',ARRAY['Arms','Shoulders'],'Beginner','Compound',ARRAY['cable row']),
('wide-grip-cable-row','Wide-Grip Cable Row','Back','Cable',ARRAY['Shoulders','Arms'],'Beginner','Compound',ARRAY['wide row']),
('lat-pulldown','Lat Pulldown','Back','Cable',ARRAY['Arms'],'Beginner','Compound',ARRAY['lat pull','pulldown']),
('wide-grip-pulldown','Wide-Grip Lat Pulldown','Back','Cable',ARRAY['Arms'],'Beginner','Compound',ARRAY['wide pulldown']),
('close-grip-pulldown','Close-Grip Pulldown','Back','Cable',ARRAY['Arms'],'Beginner','Compound',ARRAY['v bar pulldown']),
('straight-arm-pulldown','Straight-Arm Pulldown','Back','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['straight arm pull']),
('pull-up','Pull-Up','Back','Bodyweight',ARRAY['Arms'],'Intermediate','Compound',ARRAY['pullup','pull ups']),
('chin-up','Chin-Up','Back','Bodyweight',ARRAY['Arms'],'Intermediate','Compound',ARRAY['chinup']),
('assisted-pull-up','Assisted Pull-Up','Back','Machine',ARRAY['Arms'],'Beginner','Compound',ARRAY['assisted pullup']),
('inverted-row','Inverted Row','Back','Bodyweight',ARRAY['Arms'],'Beginner','Compound',ARRAY['bodyweight row']),
('machine-row','Machine Row','Back','Machine',ARRAY['Arms'],'Beginner','Compound',ARRAY['hammer row']),
('high-row-machine','High Row Machine','Back','Machine',ARRAY['Arms','Shoulders'],'Beginner','Compound',ARRAY['high row']),
('barbell-shrug','Barbell Shrug','Back','Barbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['shrugs','traps']),
('dumbbell-shrug','Dumbbell Shrug','Back','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['db shrug']),
('rack-pull','Rack Pull','Back','Barbell',ARRAY['Glutes','Forearms'],'Intermediate','Compound',ARRAY[]::text[]),
('good-morning','Good Morning','Back','Barbell',ARRAY['Glutes','Legs'],'Intermediate','Compound',ARRAY['gm']),
('hyperextension','Hyperextension','Back','Bodyweight',ARRAY['Glutes'],'Beginner','Isolation',ARRAY['back extension','hyper']),

-- ============== SHOULDERS ==============
('overhead-press','Overhead Press','Shoulders','Barbell',ARRAY['Triceps','Core'],'Intermediate','Compound',ARRAY['ohp','military press','press']),
('seated-barbell-press','Seated Barbell Press','Shoulders','Barbell',ARRAY['Triceps'],'Intermediate','Compound',ARRAY['seated press']),
('push-press','Push Press','Shoulders','Barbell',ARRAY['Triceps','Legs'],'Advanced','Compound',ARRAY[]::text[]),
('dumbbell-shoulder-press','Dumbbell Shoulder Press','Shoulders','Dumbbell',ARRAY['Triceps'],'Beginner','Compound',ARRAY['db shoulder press','db press']),
('arnold-press','Arnold Press','Shoulders','Dumbbell',ARRAY['Triceps'],'Intermediate','Compound',ARRAY['arnold']),
('seated-dumbbell-press','Seated Dumbbell Press','Shoulders','Dumbbell',ARRAY['Triceps'],'Beginner','Compound',ARRAY['seated db press']),
('lateral-raise','Lateral Raise','Shoulders','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['side raise','lat raise']),
('cable-lateral-raise','Cable Lateral Raise','Shoulders','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['cable side raise']),
('front-raise','Front Raise','Shoulders','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['db front raise']),
('cable-front-raise','Cable Front Raise','Shoulders','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('rear-delt-fly','Rear Delt Fly','Shoulders','Dumbbell',ARRAY['Back'],'Beginner','Isolation',ARRAY['reverse fly','bent over fly']),
('reverse-pec-deck','Reverse Pec Deck','Shoulders','Machine',ARRAY['Back'],'Beginner','Isolation',ARRAY['rear delt machine']),
('face-pull','Face Pull','Shoulders','Cable',ARRAY['Back'],'Beginner','Isolation',ARRAY['face pulls']),
('upright-row','Upright Row','Shoulders','Barbell',ARRAY['Back'],'Beginner','Compound',ARRAY[]::text[]),
('cable-upright-row','Cable Upright Row','Shoulders','Cable',ARRAY['Back'],'Beginner','Compound',ARRAY[]::text[]),
('shoulder-press-machine','Shoulder Press Machine','Shoulders','Machine',ARRAY['Triceps'],'Beginner','Compound',ARRAY['machine shoulder press']),
('smith-shoulder-press','Smith Machine Shoulder Press','Shoulders','Smith',ARRAY['Triceps'],'Beginner','Compound',ARRAY['smith ohp']),
('landmine-press','Landmine Press','Shoulders','Barbell',ARRAY['Triceps','Core'],'Intermediate','Compound',ARRAY[]::text[]),

-- ============== ARMS ==============
('barbell-curl','Barbell Curl','Arms','Barbell',ARRAY['Forearms'],'Beginner','Isolation',ARRAY['bb curl','curl']),
('ez-bar-curl','EZ Bar Curl','Arms','Barbell',ARRAY['Forearms'],'Beginner','Isolation',ARRAY['ez curl']),
('preacher-curl','Preacher Curl','Arms','Barbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['preacher']),
('dumbbell-curl','Dumbbell Curl','Arms','Dumbbell',ARRAY['Forearms'],'Beginner','Isolation',ARRAY['db curl']),
('hammer-curl','Hammer Curl','Arms','Dumbbell',ARRAY['Forearms'],'Beginner','Isolation',ARRAY['hammers']),
('incline-dumbbell-curl','Incline Dumbbell Curl','Arms','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['incline curl']),
('concentration-curl','Concentration Curl','Arms','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['concentration']),
('cable-curl','Cable Curl','Arms','Cable',ARRAY['Forearms'],'Beginner','Isolation',ARRAY[]::text[]),
('cable-rope-hammer-curl','Cable Rope Hammer Curl','Arms','Cable',ARRAY['Forearms'],'Beginner','Isolation',ARRAY['rope hammer']),
('spider-curl','Spider Curl','Arms','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('machine-curl','Machine Curl','Arms','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('triceps-pushdown','Triceps Pushdown','Arms','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['tri pushdown','pushdown','tricep pushdown']),
('rope-pushdown','Rope Pushdown','Arms','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['rope tricep']),
('overhead-cable-extension','Overhead Cable Extension','Arms','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['overhead tricep']),
('skull-crusher','Skull Crusher','Arms','Barbell',ARRAY[]::text[],'Intermediate','Isolation',ARRAY['skullcrusher','lying tricep ext']),
('dumbbell-overhead-extension','Dumbbell Overhead Extension','Arms','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['db overhead tri']),
('dumbbell-kickback','Dumbbell Kickback','Arms','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['kickback']),
('triceps-dip','Triceps Dip','Arms','Bodyweight',ARRAY['Chest'],'Intermediate','Compound',ARRAY['tri dip','bench dip']),
('bench-dip','Bench Dip','Arms','Bodyweight',ARRAY['Chest'],'Beginner','Compound',ARRAY[]::text[]),
('triceps-machine','Triceps Extension Machine','Arms','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['machine tricep']),
('close-grip-pushup','Close-Grip Push-Up','Arms','Bodyweight',ARRAY['Chest'],'Beginner','Compound',ARRAY['cg pushup','diamond pushup']),
('zottman-curl','Zottman Curl','Arms','Dumbbell',ARRAY['Forearms'],'Beginner','Isolation',ARRAY['zottman']),

-- ============== LEGS ==============
('back-squat','Back Squat','Legs','Barbell',ARRAY['Glutes','Core'],'Intermediate','Compound',ARRAY['squat','bb squat']),
('front-squat','Front Squat','Legs','Barbell',ARRAY['Glutes','Core'],'Advanced','Compound',ARRAY['fs']),
('high-bar-squat','High-Bar Squat','Legs','Barbell',ARRAY['Glutes','Core'],'Intermediate','Compound',ARRAY[]::text[]),
('low-bar-squat','Low-Bar Squat','Legs','Barbell',ARRAY['Glutes','Back'],'Intermediate','Compound',ARRAY[]::text[]),
('pause-squat','Pause Squat','Legs','Barbell',ARRAY['Glutes','Core'],'Advanced','Compound',ARRAY[]::text[]),
('box-squat','Box Squat','Legs','Barbell',ARRAY['Glutes'],'Intermediate','Compound',ARRAY[]::text[]),
('overhead-squat','Overhead Squat','Legs','Barbell',ARRAY['Shoulders','Core'],'Advanced','Compound',ARRAY['ohs']),
('goblet-squat','Goblet Squat','Legs','Dumbbell',ARRAY['Glutes','Core'],'Beginner','Compound',ARRAY['goblet']),
('bulgarian-split-squat','Bulgarian Split Squat','Legs','Dumbbell',ARRAY['Glutes'],'Intermediate','Compound',ARRAY['bss','bulgarian','split squat']),
('walking-lunge','Walking Lunge','Legs','Dumbbell',ARRAY['Glutes'],'Beginner','Compound',ARRAY['lunge','lunges']),
('reverse-lunge','Reverse Lunge','Legs','Dumbbell',ARRAY['Glutes'],'Beginner','Compound',ARRAY[]::text[]),
('barbell-lunge','Barbell Lunge','Legs','Barbell',ARRAY['Glutes'],'Intermediate','Compound',ARRAY[]::text[]),
('step-up','Step-Up','Legs','Dumbbell',ARRAY['Glutes'],'Beginner','Compound',ARRAY['step ups']),
('leg-press','Leg Press','Legs','Machine',ARRAY['Glutes'],'Beginner','Compound',ARRAY['lp']),
('hack-squat','Hack Squat','Legs','Machine',ARRAY['Glutes'],'Intermediate','Compound',ARRAY[]::text[]),
('pendulum-squat','Pendulum Squat','Legs','Machine',ARRAY['Glutes'],'Intermediate','Compound',ARRAY[]::text[]),
('smith-squat','Smith Machine Squat','Legs','Smith',ARRAY['Glutes'],'Beginner','Compound',ARRAY['smith squat']),
('leg-extension','Leg Extension','Legs','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['leg ext','quad extension']),
('lying-leg-curl','Lying Leg Curl','Legs','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['leg curl','hamstring curl']),
('seated-leg-curl','Seated Leg Curl','Legs','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('romanian-deadlift','Romanian Deadlift','Legs','Barbell',ARRAY['Glutes','Back'],'Intermediate','Compound',ARRAY['rdl','romanian dl']),
('dumbbell-rdl','Dumbbell Romanian Deadlift','Legs','Dumbbell',ARRAY['Glutes','Back'],'Beginner','Compound',ARRAY['db rdl']),
('stiff-leg-deadlift','Stiff-Leg Deadlift','Legs','Barbell',ARRAY['Glutes','Back'],'Intermediate','Compound',ARRAY['sldl']),
('single-leg-rdl','Single-Leg RDL','Legs','Dumbbell',ARRAY['Glutes'],'Intermediate','Compound',ARRAY['sl rdl']),
('nordic-curl','Nordic Curl','Legs','Bodyweight',ARRAY[]::text[],'Advanced','Isolation',ARRAY['nordics']),
('sissy-squat','Sissy Squat','Legs','Bodyweight',ARRAY[]::text[],'Advanced','Isolation',ARRAY[]::text[]),
('belt-squat','Belt Squat','Legs','Machine',ARRAY['Glutes'],'Intermediate','Compound',ARRAY[]::text[]),

-- ============== GLUTES ==============
('hip-thrust','Hip Thrust','Glutes','Barbell',ARRAY['Legs'],'Intermediate','Compound',ARRAY['ht','barbell hip thrust']),
('dumbbell-hip-thrust','Dumbbell Hip Thrust','Glutes','Dumbbell',ARRAY['Legs'],'Beginner','Compound',ARRAY['db hip thrust']),
('glute-bridge','Glute Bridge','Glutes','Bodyweight',ARRAY['Legs'],'Beginner','Compound',ARRAY['bridge']),
('barbell-glute-bridge','Barbell Glute Bridge','Glutes','Barbell',ARRAY['Legs'],'Intermediate','Compound',ARRAY[]::text[]),
('cable-kickback','Cable Glute Kickback','Glutes','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['kickback']),
('hip-abduction-machine','Hip Abduction Machine','Glutes','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['abductor machine']),
('hip-adduction-machine','Hip Adduction Machine','Glutes','Machine',ARRAY['Legs'],'Beginner','Isolation',ARRAY['adductor machine']),
('frog-pump','Frog Pump','Glutes','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('curtsy-lunge','Curtsy Lunge','Glutes','Dumbbell',ARRAY['Legs'],'Beginner','Compound',ARRAY[]::text[]),
('single-leg-hip-thrust','Single-Leg Hip Thrust','Glutes','Bodyweight',ARRAY['Legs'],'Intermediate','Compound',ARRAY[]::text[]),

-- ============== CORE ==============
('plank','Plank','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['planks']),
('side-plank','Side Plank','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('crunch','Crunch','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['crunches']),
('sit-up','Sit-Up','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['situp','sit ups']),
('bicycle-crunch','Bicycle Crunch','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['bicycles']),
('leg-raise','Leg Raise','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['lying leg raise']),
('hanging-leg-raise','Hanging Leg Raise','Core','Bodyweight',ARRAY[]::text[],'Intermediate','Isolation',ARRAY['hanging leg']),
('hanging-knee-raise','Hanging Knee Raise','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['knee raise']),
('cable-crunch','Cable Crunch','Core','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['kneeling crunch']),
('ab-wheel','Ab Wheel Rollout','Core','Bodyweight',ARRAY[]::text[],'Intermediate','Isolation',ARRAY['ab roller','rollout']),
('russian-twist','Russian Twist','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['twists']),
('mountain-climber','Mountain Climber','Core','Bodyweight',ARRAY[]::text[],'Beginner','Compound',ARRAY['climbers']),
('dead-bug','Dead Bug','Core','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY['deadbug']),
('woodchopper','Cable Woodchopper','Core','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['wood chop']),
('pallof-press','Pallof Press','Core','Cable',ARRAY[]::text[],'Beginner','Isolation',ARRAY['pallof']),

-- ============== FOREARMS ==============
('wrist-curl','Wrist Curl','Forearms','Barbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('reverse-wrist-curl','Reverse Wrist Curl','Forearms','Barbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),
('dumbbell-wrist-curl','Dumbbell Wrist Curl','Forearms','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['db wrist curl']),
('reverse-curl','Reverse Curl','Forearms','Barbell',ARRAY['Arms'],'Beginner','Isolation',ARRAY[]::text[]),
('farmer-carry','Farmer Carry','Forearms','Dumbbell',ARRAY['Core','Back'],'Beginner','Compound',ARRAY['farmers walk','carries']),
('wrist-roller','Wrist Roller','Forearms','Bodyweight',ARRAY[]::text[],'Beginner','Isolation',ARRAY[]::text[]),

-- ============== CALVES ==============
('standing-calf-raise','Standing Calf Raise','Calves','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['calf raise','standing calves']),
('seated-calf-raise','Seated Calf Raise','Calves','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['seated calves']),
('smith-calf-raise','Smith Machine Calf Raise','Calves','Smith',ARRAY[]::text[],'Beginner','Isolation',ARRAY['smith calves']),
('leg-press-calf-raise','Leg Press Calf Raise','Calves','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['lp calf']),
('dumbbell-calf-raise','Dumbbell Calf Raise','Calves','Dumbbell',ARRAY[]::text[],'Beginner','Isolation',ARRAY['db calf']),
('donkey-calf-raise','Donkey Calf Raise','Calves','Machine',ARRAY[]::text[],'Beginner','Isolation',ARRAY['donkey calves']),

-- ============== FULL BODY ==============
('clean-and-press','Clean & Press','Full Body','Barbell',ARRAY['Legs','Back','Shoulders'],'Advanced','Compound',ARRAY['clean and press']),
('power-clean','Power Clean','Full Body','Barbell',ARRAY['Legs','Back','Shoulders'],'Advanced','Compound',ARRAY['clean']),
('snatch','Snatch','Full Body','Barbell',ARRAY['Legs','Back','Shoulders'],'Advanced','Compound',ARRAY[]::text[]),
('thruster','Thruster','Full Body','Barbell',ARRAY['Legs','Shoulders'],'Intermediate','Compound',ARRAY[]::text[]),
('burpee','Burpee','Full Body','Bodyweight',ARRAY['Chest','Legs'],'Beginner','Compound',ARRAY['burpees']),
('kettlebell-swing','Kettlebell Swing','Full Body','Kettlebell',ARRAY['Glutes','Back','Core'],'Beginner','Compound',ARRAY['kb swing','swing']),
('turkish-get-up','Turkish Get-Up','Full Body','Kettlebell',ARRAY['Core','Shoulders'],'Advanced','Compound',ARRAY['tgu']),
('kettlebell-clean','Kettlebell Clean','Full Body','Kettlebell',ARRAY['Legs','Back'],'Intermediate','Compound',ARRAY['kb clean']),
('kettlebell-snatch','Kettlebell Snatch','Full Body','Kettlebell',ARRAY['Legs','Back','Shoulders'],'Advanced','Compound',ARRAY['kb snatch']),

-- ============== CARDIO ==============
('treadmill-run','Treadmill Run','Cardio','Machine',ARRAY[]::text[],'Beginner','Cardio',ARRAY['treadmill','run']),
('treadmill-walk','Treadmill Walk','Cardio','Machine',ARRAY[]::text[],'Beginner','Cardio',ARRAY['walk','incline walk']),
('stationary-bike','Stationary Bike','Cardio','Machine',ARRAY[]::text[],'Beginner','Cardio',ARRAY['bike','cycling']),
('rowing-machine','Rowing Machine','Cardio','Machine',ARRAY['Back','Legs'],'Beginner','Cardio',ARRAY['row erg','erg','rower']),
('elliptical','Elliptical','Cardio','Machine',ARRAY[]::text[],'Beginner','Cardio',ARRAY[]::text[]),
('stairmaster','Stairmaster','Cardio','Machine',ARRAY['Legs','Glutes'],'Beginner','Cardio',ARRAY['stairs','stepmill']),
('jump-rope','Jump Rope','Cardio','Bodyweight',ARRAY['Calves'],'Beginner','Cardio',ARRAY['skipping']),
('sled-push','Sled Push','Cardio','Machine',ARRAY['Legs','Glutes'],'Intermediate','Cardio',ARRAY['prowler']),
('assault-bike','Assault Bike','Cardio','Machine',ARRAY[]::text[],'Intermediate','Cardio',ARRAY['air bike']),
('battle-ropes','Battle Ropes','Cardio','Bodyweight',ARRAY['Shoulders','Core'],'Intermediate','Cardio',ARRAY['ropes'])

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  muscle_group = EXCLUDED.muscle_group,
  equipment = EXCLUDED.equipment,
  secondary_muscles = EXCLUDED.secondary_muscles,
  difficulty = EXCLUDED.difficulty,
  exercise_type = EXCLUDED.exercise_type,
  aliases = EXCLUDED.aliases;
