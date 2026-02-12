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
  muscleGroup: 'chest' | 'back' | 'biceps' | 'triceps' | 'delts'; // Only the muscle groups supported by the SVG
  sets: number;
  lastWorkoutDate: Date;
}

interface CrepatureProps {
  muscleData?: MuscleData[];
}

const Crepature: React.FC<CrepatureProps> = ({
  muscleData = [],
}) => {
  const [svgContent, setSvgContent] = useState("");
  
  // Function to fetch muscle data from database
  const fetchMuscleData = async () => {
    try {
      // Get all plans
      const plans = await dbLayer.getAllPlans();
      
      // Initialize muscle data object to track sets and last workout date for each muscle group
      // Only include muscle groups that are supported by the SVG
      const muscleDataMap: Record<'chest' | 'back' | 'biceps' | 'triceps' | 'delts', { sets: number; lastWorkoutDate: Date | null }> = {
        chest: { sets: 0, lastWorkoutDate: null },
        back: { sets: 0, lastWorkoutDate: null },
        biceps: { sets: 0, lastWorkoutDate: null },
        triceps: { sets: 0, lastWorkoutDate: null },
        delts: { sets: 0, lastWorkoutDate: null },
      };

      // Iterate through all plans to collect workout data
      for (const plan of plans) {
        const trainings = await dbLayer.getTrainingsByPlan(plan.planName);
        
        for (const training of trainings) {
          const exercises = await dbLayer.getExercisesByTraining(training.id);
          
          for (const exercise of exercises) {
            // Get results for this exercise
            const results = await dbLayer.getResultsByExercise(exercise.id);
            
            // Count sets and find the most recent workout date for this muscle group
            // Only process muscle groups that are supported by the SVG
            if (['chest', 'back', 'biceps', 'triceps', 'delts'].includes(exercise.muscleGroup)) {
              for (const result of results) {
                const resultDate = new Date(result.date);
                
                // Update the muscle group data
                const muscleGroup = exercise.muscleGroup as 'chest' | 'back' | 'biceps' | 'triceps' | 'delts';
                if (muscleDataMap[muscleGroup]) {
                  muscleDataMap[muscleGroup].sets += 1; // Increment sets count
                  
                  // Update last workout date if this is more recent
                  if (!muscleDataMap[muscleGroup].lastWorkoutDate || 
                      resultDate > muscleDataMap[muscleGroup].lastWorkoutDate!) {
                    muscleDataMap[muscleGroup].lastWorkoutDate = resultDate;
                  }
                }
              }
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
      const dataToUse = muscleData && muscleData.length > 0 
        ? muscleData 
        : await fetchMuscleData();
      
      // Calculate colors for each muscle group based on soreness level
      const muscleColors: Record<string, string> = {};
      
      dataToUse.forEach(muscle => {
        const sorenessLevel = calculateSorenessLevel(muscle.sets, muscle.lastWorkoutDate);
        muscleColors[muscle.muscleGroup] = SORENESS_COLORS[sorenessLevel as keyof typeof SORENESS_COLORS];
      });
      
      // Log the data being sent to the SVG generator
      console.log("[Crepature] Data sent to SVG generator:", muscleColors);
      
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
