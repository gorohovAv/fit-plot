/* eslint-disable @typescript-eslint/array-type */
import { generateAthleteSvg } from "@/utils/svgGen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import * as dbLayer from "../store/dbLayer";
import { MuscleGroup } from "../store/store";

const SORENESS_COLORS = {
  none: "#484537",
  weak: "#FF5C5C",
  medium: "#FF0808",
  strong: "#A30000",
};

const calculateSorenessLevel = (
  sets: number,
  lastWorkoutDate: Date,
): string => {
  const today = new Date();
  const timeDiff = today.getTime() - lastWorkoutDate.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);

  if (daysDiff <= 0.1) {
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
    | "arms";
  sets: number;
  lastWorkoutDate: Date;
}

interface CrepatureProps {
  muscleData?: MuscleData[];
}

const Crepature: React.FC<CrepatureProps> = ({ muscleData = [] }) => {
  const [svgContent, setSvgContent] = useState("");

  const fetchMuscleData = async () => {
    try {
      const plans = await dbLayer.getAllPlans();

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

      for (const plan of plans) {
        const trainings = await dbLayer.getTrainingsByPlan(plan.planName);

        for (const training of trainings) {
          const exercises = await dbLayer.getExercisesByTraining(training.id);

          for (const exercise of exercises) {
            const results = await dbLayer.getRecentResultsForExerciseIds(
              [exercise.id],
              30,
            );

            const muscleGroup = exercise.muscleGroup;

            if (muscleGroup === "arms") {
              const resultsByDate: Record<string, typeof results> = {};
              results.forEach((result) => {
                const dateStr = result.date.split("T")[0];
                if (!resultsByDate[dateStr]) {
                  resultsByDate[dateStr] = [];
                }
                resultsByDate[dateStr].push(result);
              });

              Object.keys(resultsByDate).forEach((dateStr) => {
                const dateResults = resultsByDate[dateStr];
                const resultDate = new Date(dateResults[0].date);

                muscleDataMap.biceps.sets += 1;
                if (
                  !muscleDataMap.biceps.lastWorkoutDate ||
                  resultDate > muscleDataMap.biceps.lastWorkoutDate!
                ) {
                  muscleDataMap.biceps.lastWorkoutDate = resultDate;
                }

                muscleDataMap.triceps.sets += 1;
                if (
                  !muscleDataMap.triceps.lastWorkoutDate ||
                  resultDate > muscleDataMap.triceps.lastWorkoutDate!
                ) {
                  muscleDataMap.triceps.lastWorkoutDate = resultDate;
                }
              });
            } else if (
              ["chest", "back", "biceps", "triceps", "delts", "legs"].includes(
                muscleGroup,
              )
            ) {
              const resultsByDate: Record<string, typeof results> = {};
              results.forEach((result) => {
                const dateStr = result.date.split("T")[0];
                if (!resultsByDate[dateStr]) {
                  resultsByDate[dateStr] = [];
                }
                resultsByDate[dateStr].push(result);
              });

              Object.keys(resultsByDate).forEach((dateStr) => {
                const dateResults = resultsByDate[dateStr];
                const resultDate = new Date(dateResults[0].date);

                const typedMuscleGroup = muscleGroup as
                  | "chest"
                  | "back"
                  | "biceps"
                  | "triceps"
                  | "delts"
                  | "legs";
                if (muscleDataMap[typedMuscleGroup]) {
                  muscleDataMap[typedMuscleGroup].sets += 1;

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

      const formattedMuscleData: MuscleData[] = Object.entries(muscleDataMap)
        .filter(([_, data]) => data.lastWorkoutDate !== null)
        .map(([muscleGroup, data]) => ({
          id: muscleGroup,
          muscleGroup: muscleGroup as MuscleGroup,
          sets: data.sets,
          lastWorkoutDate: data.lastWorkoutDate!,
        }));

      return formattedMuscleData;
    } catch (error) {
      console.error("Error fetching muscle data:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadAndGenerateSvg = async () => {
      const dataToUse =
        muscleData && muscleData.length > 0
          ? muscleData
          : await fetchMuscleData();

      const muscleColors: Record<string, string> = {};

      const allSupportedMuscles: Array<
        "chest" | "back" | "biceps" | "triceps" | "delts" | "legs"
      > = ["chest", "back", "biceps", "triceps", "delts", "legs"];
      allSupportedMuscles.forEach((muscleGroup) => {
        muscleColors[muscleGroup] = SORENESS_COLORS.none;
      });

      console.log("[Crepature] Raw muscle data from DB:", dataToUse);

      dataToUse.forEach((muscle) => {
        const sorenessLevel = calculateSorenessLevel(
          muscle.sets,
          muscle.lastWorkoutDate,
        );
        muscleColors[muscle.muscleGroup] =
          SORENESS_COLORS[sorenessLevel as keyof typeof SORENESS_COLORS];

        const today = new Date();
        const timeDiff = today.getTime() - muscle.lastWorkoutDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        const s = muscle.sets / daysDiff;

        console.log(
          `[Crepature] Muscle: ${muscle.muscleGroup}, Sets: ${muscle.sets}, Days since workout: ${daysDiff.toFixed(2)}, S-value: ${s.toFixed(2)}, Soreness level: ${sorenessLevel}, Color: ${SORENESS_COLORS[sorenessLevel as keyof typeof SORENESS_COLORS]}`,
        );
      });

      allSupportedMuscles.forEach((muscleGroup) => {
        if (!dataToUse.some((muscle) => muscle.muscleGroup === muscleGroup)) {
          console.log(
            `[Crepature] Muscle: ${muscleGroup}, No recent data, Default color: ${SORENESS_COLORS.none}`,
          );
        }
      });

      console.log(
        "[Crepature] Final data sent to SVG generator:",
        muscleColors,
      );

      const svg = generateAthleteSvg(muscleColors as any);
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
    backgroundColor: "transparent",
    borderRadius: 16,
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
