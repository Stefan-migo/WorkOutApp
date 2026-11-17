const frameSource = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const frameSets: Record<string, string> = {
  'Push-up': 'Pushups',
  'Pull-up': 'Pullups',
  Squat: 'Bodyweight_Squat',
  Deadlift: 'Barbell_Deadlift',
  'Bench Press': 'Barbell_Bench_Press_-_Medium_Grip',
  'Overhead Press': 'Standing_Dumbbell_Press',
  'Barbell Row': 'Bent_Over_Barbell_Row',
  Plank: 'Plank',
  Lunge: 'Bodyweight_Walking_Lunge',
  'Glute Bridge': 'Butt_Lift_Bridge',
  'Dumbbell Curl': 'Dumbbell_Bicep_Curl',
  'Tricep Dip': 'Bench_Dips',
  'Mountain Climber': 'Mountain_Climbers',
  'Lat Pulldown': 'Wide-Grip_Lat_Pulldown',
  'Leg Press': 'Leg_Press',
  'Chest Fly': 'Dumbbell_Flyes',
  'Russian Twist': 'Russian_Twist',
}

const repDbFrames: Record<string, string[]> = {
  Burpee: ['burpees-main'],
  'Jumping Jack': ['jumping-jacks-start', 'jumping-jacks-peak'],
  'Romanian Deadlift': ['dumbbell-romanian-deadlift-start', 'dumbbell-romanian-deadlift-peak'],
}

export function catalogMedia(name: string) {
  if (Object.hasOwn(repDbFrames, name)) {
    return {
      images: repDbFrames[name]!.map((frame) => `https://exercise-dataset.com/images/flat/${frame}.webp`),
      author: 'RepDB (repdb.co)',
      source: 'https://repdb.co',
      license: 'RepDB Free License',
    }
  }
  if (!Object.hasOwn(frameSets, name)) return undefined
  const frameSet = frameSets[name]
  return {
    images: [`${frameSource}/${frameSet}/0.jpg`, `${frameSource}/${frameSet}/1.jpg`],
    author: 'free-exercise-db',
    source: 'https://github.com/yuhonas/free-exercise-db',
    license: 'Public domain',
  }
}
