import * as dbLayer from "@/store/dbLayer";

// Define the structure for parsed data
interface OldVersionExercise {
  name: string;
  results: {
    weight: number;
    reps: number;
    date: string; // ISO string format
  }[];
}

/**
 * Parses the old version format data
 * @param text The raw text from the old version export
 * @returns Array of exercises with their results
 */
export function parseOldVersionFormat(text: string): OldVersionExercise[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const exercises: OldVersionExercise[] = [];
  let currentExercise: OldVersionExercise | null = null;
  let inResultsSection = false; // Flag to know when we're in the results section

  for (const line of lines) {
    // Skip empty lines
    if (!line) continue;

    // Check if line is a pure exercise name (no numbers, no x/х, no dates)
    // This indicates the start of a results section for that exercise
    const isExerciseName = !line.includes('x') &&
                          !line.includes('х') &&
                          !/^\d/.test(line) && // Doesn't start with a digit
                          !/\d+\s*[xх]\s*\d+/.test(line) &&
                          !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(line) &&
                          !/^\d+\)/.test(line); // Doesn't start with "number)"

    if (isExerciseName && line.length > 0) {
      // Found an exercise name, start a new exercise
      if (currentExercise) {
        // Save the previous exercise if it has results
        if (currentExercise.results.length > 0) {
          exercises.push(currentExercise);
        }
      }

      currentExercise = {
        name: line,
        results: []
      };
      inResultsSection = true;
    } else if (inResultsSection && currentExercise) {
      // We're expecting results for the current exercise
      // Format: weight x reps date or weight х reps date
      const resultRegex = /(\d+(?:\.\d+)?)\s*[xх]\s*(\d+(?:\.\d+)?)\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/;
      const match = line.match(resultRegex);

      if (match) {
        const [, weightStr, repsStr, dateString] = match;
        const weight = parseFloat(weightStr);
        const reps = parseFloat(repsStr);

        if (!isNaN(weight) && !isNaN(reps)) {
          currentExercise.results.push({
            weight,
            reps,
            date: dateString
          });
        }
      }
    }
  }

  // Don't forget to add the last exercise if it exists and has results
  if (currentExercise && currentExercise.results.length > 0) {
    exercises.push(currentExercise);
  }

  return exercises;
}

/**
 * Imports data from the old version format into the database
 * @param text The raw text from the old version export
 */
export async function importOldVersionData(text: string): Promise<void> {
  console.log("Starting import of old version data...");
  const exercises = parseOldVersionFormat(text);
  console.log(`Parsed ${exercises.length} exercises`);

  if (exercises.length === 0) {
    throw new Error("No valid exercises found in the import data");
  }

  console.log("Exercises to import:", exercises);
  // Use the migrate function from dbLayer
  await dbLayer.migrateOldVersionData(exercises);
  console.log("Import completed successfully");
}

/**
 * Infers muscle group from exercise name
 * @param exerciseName Name of the exercise
 * @returns Inferred muscle group
 */
function inferMuscleGroup(exerciseName: string): string {
  const lowerName = exerciseName.toLowerCase();
  
  // Define keywords for each muscle group
  const muscleGroups = {
    back: ["тяга", "подтяг", "горизонт", "вертикаль"],
    chest: ["жим", "пресс"],
    legs: ["присед", "выпад", "икры", "бедра"],
    shoulders: ["дельты", "плеч", "махи"],
    arms: ["бицепс", "трицепс", "пресс", "предплеч"],
    abs: ["пресс"]
  };
  
  // Check each muscle group
  for (const [group, keywords] of Object.entries(muscleGroups)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return group;
      }
    }
  }
  
  // Default to chest if no match found
  return "chest";
}