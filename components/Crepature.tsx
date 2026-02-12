import { generateAthleteSvg } from "@/utils/svgGen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as dbLayer from "../store/dbLayer";
import { MuscleGroup } from "../store/store";

// Define the colors for different levels of soreness
const SORENESS_COLORS = {
  none: "#484537", // No soreness
  weak: "#FF5C5C", // Weak soreness
  medium: "#FF0808", // Medium soreness
  strong: "#A30000", // Strong soreness
};

// Calculate soreness level based on the formula: s = sets / (today - last workout date in days)
const calculateSorenessLevel = (
  sets: number,
  lastWorkoutDate: Date,
): string => {
  const today = new Date();
  const timeDiff = today.getTime() - lastWorkoutDate.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days

  // Handle case where workout was today (to avoid division by zero or very small numbers)
  if (daysDiff <= 0.1) {
    // Less than 2.4 hours ago
    if (sets > 4) return "strong";
    else if (sets > 3) return "medium";
    else if (sets > 2) return "weak";
    else return "none";
  }

  const s = sets / daysDiff;

  if (s > 4) return "strong";
  else if (s > 3) return "medium";
  else if (s > 2) return "weak";
  else return "none";
};

interface MuscleData {
  id: string;
  muscleGroup:
    | "chest"
    | "back"
    | "biceps"
    | "triceps"
    | "delts"
    | "legs"
    | "arms"; // All muscle groups that might be in DB, with 'arms' handled specially
  sets: number;
  lastWorkoutDate: Date;
}

interface CrepatureProps {
  muscleData?: MuscleData[];
}

const Crepature: React.FC<CrepatureProps> = ({ muscleData = [] }) => {
  const [svgContent, setSvgContent] = useState("");

  // Function to fetch muscle data from database
  const fetchMuscleData = async () => {
    try {
      // Get all plans
      const plans = await dbLayer.getAllPlans();

      // Initialize muscle data object to track sets and last workout date for each muscle group
      // Include all muscle groups that are supported by the SVG
      const muscleDataMap: Record<
        "chest" | "back" | "biceps" | "triceps" | "delts" | "legs",
        { sets: number; lastWorkoutDate: Date | null }
      > = {
        chest: { sets: 0, lastWorkoutDate: null },
        back: { sets: 0, lastWorkoutDate: null },
        biceps: { sets: 0, lastWorkoutDate: null },
        triceps: { sets: 0, lastWorkoutDate: null },
        delts: { sets: 0, lastWorkoutDate: null },
        legs: { sets: 0, lastWorkoutDate: null },
      };

      // Iterate through all plans to collect workout data
      for (const plan of plans) {
        const trainings = await dbLayer.getTrainingsByPlan(plan.planName);

        for (const training of trainings) {
          const exercises = await dbLayer.getExercisesByTraining(training.id);

          for (const exercise of exercises) {
            // Get recent results for this exercise (within last 30 days)
            const results = await dbLayer.getRecentResultsForExerciseIds(
              [exercise.id],
              30,
            );

            // Count sets and find the most recent workout date for this muscle group
            // Process muscle groups that are supported by the SVG
            const muscleGroup = exercise.muscleGroup;

            // Handle 'arms' muscle group by splitting it between biceps and triceps
            if (muscleGroup === "arms") {
              // Group results by date to count unique workout sessions
              const resultsByDate: Record<string, typeof results> = {};
              results.forEach((result) => {
                const dateStr = result.date.split("T")[0]; // Extract date part (YYYY-MM-DD)
                if (!resultsByDate[dateStr]) {
                  resultsByDate[dateStr] = [];
                }
                resultsByDate[dateStr].push(result);
              });

              // Process each unique workout date
              Object.keys(resultsByDate).forEach((dateStr) => {
                const dateResults = resultsByDate[dateStr];
                const resultDate = new Date(dateResults[0].date);

                // Add to biceps (count workout session)
                muscleDataMap.biceps.sets += 1;
                if (
                  !muscleDataMap.biceps.lastWorkoutDate ||
                  resultDate > muscleDataMap.biceps.lastWorkoutDate!
                ) {
                  muscleDataMap.biceps.lastWorkoutDate = resultDate;
                }

                // Add to triceps (count workout session)
                muscleDataMap.triceps.sets += 1;
                if (
                  !muscleDataMap.triceps.lastWorkoutDate ||
                  resultDate > muscleDataMap.triceps.lastWorkoutDate!
                ) {
                  muscleDataMap.triceps.lastWorkoutDate = resultDate;
                }
              });
            }
            // Process other supported muscle groups
            else if (
              ["chest", "back", "biceps", "triceps", "delts", "legs"].includes(
                muscleGroup,
              )
            ) {
              // Group results by date to count unique workout sessions
              const resultsByDate: Record<string, typeof results> = {};
              results.forEach((result) => {
                const dateStr = result.date.split("T")[0]; // Extract date part (YYYY-MM-DD)
                if (!resultsByDate[dateStr]) {
                  resultsByDate[dateStr] = [];
                }
                resultsByDate[dateStr].push(result);
              });

              // Process each unique workout date
              Object.keys(resultsByDate).forEach((dateStr) => {
                const dateResults = resultsByDate[dateStr];
                const resultDate = new Date(dateResults[0].date);

                // Update the muscle group data
                const typedMuscleGroup = muscleGroup as
                  | "chest"
                  | "back"
                  | "biceps"
                  | "triceps"
                  | "delts"
                  | "legs";
                if (muscleDataMap[typedMuscleGroup]) {
                  muscleDataMap[typedMuscleGroup].sets += 1; // Add 1 for each unique workout date

                  // Update last workout date if this is more recent
                  if (
                    !muscleDataMap[typedMuscleGroup].lastWorkoutDate ||
                    resultDate >
                      muscleDataMap[typedMuscleGroup].lastWorkoutDate!
                  ) {
                    muscleDataMap[typedMuscleGroup].lastWorkoutDate =
                      resultDate;
                  }
                }
              });
            }
          }
        }
      }

      // Convert the map to the format expected by the component
      const formattedMuscleData: MuscleData[] = Object.entries(muscleDataMap)
        .filter(([_, data]) => data.lastWorkoutDate !== null) // Only include muscles that were worked out
        .map(([muscleGroup, data]) => ({
          id: muscleGroup,
          muscleGroup: muscleGroup as MuscleGroup,
          sets: data.sets,
          lastWorkoutDate: data.lastWorkoutDate!,
        }));

      return formattedMuscleData;
    } catch (error) {
      console.error("Error fetching muscle data:", error);
      return []; // Return empty array on error
    }
  };

  useEffect(() => {
    const loadAndGenerateSvg = async () => {
      // Use provided muscleData if available, otherwise fetch from database
      const dataToUse =
        muscleData && muscleData.length > 0
          ? muscleData
          : await fetchMuscleData();

      // Calculate colors for each muscle group based on soreness level
      const muscleColors: Record<string, string> = {};

      // Initialize all supported muscle groups with default "no soreness" color
      const allSupportedMuscles: Array<
        "chest" | "back" | "biceps" | "triceps" | "delts" | "legs"
      > = ["chest", "back", "biceps", "triceps", "delts", "legs"];
      allSupportedMuscles.forEach((muscleGroup) => {
        muscleColors[muscleGroup] = SORENESS_COLORS.none; // Default to no soreness
      });

      console.log("[Crepature] Raw muscle data from DB:", dataToUse);

      dataToUse.forEach((muscle) => {
        const sorenessLevel = calculateSorenessLevel(
          muscle.sets,
          muscle.lastWorkoutDate,
        );
        muscleColors[muscle.muscleGroup] =
          SORENESS_COLORS[sorenessLevel as keyof typeof SORENESS_COLORS];

        // Log details about how soreness level is calculated for each muscle
        const today = new Date();
        const timeDiff = today.getTime() - muscle.lastWorkoutDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days
        const s = muscle.sets / daysDiff;

        console.log(
          `[Crepature] Muscle: ${muscle.muscleGroup}, Sets: ${muscle.sets}, Days since workout: ${daysDiff.toFixed(2)}, S-value: ${s.toFixed(2)}, Soreness level: ${sorenessLevel}, Color: ${SORENESS_COLORS[sorenessLevel as keyof typeof SORENESS_COLORS]}`,
        );
      });

      // Log muscle groups without recent data
      allSupportedMuscles.forEach((muscleGroup) => {
        if (!dataToUse.some((muscle) => muscle.muscleGroup === muscleGroup)) {
          console.log(
            `[Crepature] Muscle: ${muscleGroup}, No recent data, Default color: ${SORENESS_COLORS.none}`,
          );
        }
      });

      // Log the data being sent to the SVG generator
      console.log(
        "[Crepature] Final data sent to SVG generator:",
        muscleColors,
      );

      const svg = generateAthleteSvg(muscleColors as any); // Cast to any to match expected type
      setSvgContent(svg);
    };

    loadAndGenerateSvg();
  }, [muscleData]);

  return (
    <View style={styles.container}>
      <View style={styles.svgContainer}>
        <WebView
          originWhitelist={["*"]}
          source={{
            html: `<body style="margin:0;padding:0;">${svgContent}</body>`,
          }}
          style={styles.webview}
          scalesPageToFit={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent", // Make background transparent
    borderRadius: 16, // Add rounded corners
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendItem: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
  },
  svgContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  webview: {
    width: 300,
    height: 500,
  },
});

export default Crepature;
