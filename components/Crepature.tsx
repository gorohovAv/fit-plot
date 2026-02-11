import { generateAthleteSvg } from "@/utils/svgGen";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

// Define the colors for different levels of soreness
const SORENESS_COLORS = {
  none: "#484537", // No soreness
  weak: "#FF5C5C", // Weak soreness
  medium: "#FF0808", // Medium soreness
  strong: "#A30000", // Strong soreness
};

// Define muscle groups with their corresponding IDs in the SVG
const MUSCLE_GROUPS = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "shoulders", name: "Shoulders" },
  { id: "biceps", name: "Biceps" },
  { id: "triceps", name: "Triceps" },
  { id: "abs", name: "Abs" },
  { id: "quads", name: "Quadriceps" },
  { id: "hamstrings", name: "Hamstrings" },
  { id: "calves", name: "Calves" },
  { id: "glutes", name: "Glutes" },
];

// Mock data for muscle soreness - in a real app this would come from your workout history
const MOCK_MUSCLE_DATA = [
  {
    id: "chest",
    sets: 12,
    lastWorkoutDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  }, // 2 days ago
  {
    id: "back",
    sets: 8,
    lastWorkoutDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  }, // 1 day ago
  {
    id: "shoulders",
    sets: 15,
    lastWorkoutDate: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000),
  }, // 12 hours ago
  {
    id: "biceps",
    sets: 5,
    lastWorkoutDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }, // 3 days ago
  {
    id: "triceps",
    sets: 18,
    lastWorkoutDate: new Date(Date.now() - 0.25 * 24 * 60 * 60 * 1000),
  }, // 6 hours ago
  {
    id: "abs",
    sets: 3,
    lastWorkoutDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  }, // 4 days ago
  {
    id: "quads",
    sets: 20,
    lastWorkoutDate: new Date(Date.now() - 0.1 * 24 * 60 * 60 * 1000),
  }, // 2.4 hours ago
  {
    id: "hamstrings",
    sets: 7,
    lastWorkoutDate: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
  }, // 2.5 days ago
  {
    id: "calves",
    sets: 2,
    lastWorkoutDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  }, // 5 days ago
  {
    id: "glutes",
    sets: 14,
    lastWorkoutDate: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
  }, // 1.5 days ago
];

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

interface CrepatureProps {
  muscleData?: {
    id: string;
    sets: numbe;
    lastWorkoutDate: Date;
  }[];
}
[];
const Crepature: React.FC<CrepatureProps> = ({
  muscleData = MOCK_MUSCLE_DATA,
}) => {
  const [svgContent, setSvgContent] = useState("");

  useEffect(() => {
    const svg = generateAthleteSvg(muscleData);
    setSvgContent(svg);
  }, [muscleData]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muscle Soreness Visualization</Text>
      <View style={styles.legendContainer}>
        <View
          style={[
            styles.legendItem,
            { backgroundColor: SORENESS_COLORS.strong },
          ]}
        />
        <Text style={styles.legendText}>Strong Soreness</Text>
      </View>
      <View style={styles.legendContainer}>
        <View
          style={[
            styles.legendItem,
            { backgroundColor: SORENESS_COLORS.medium },
          ]}
        />
        <Text style={styles.legendText}>Medium Soreness</Text>
      </View>
      <View style={styles.legendContainer}>
        <View
          style={[styles.legendItem, { backgroundColor: SORENESS_COLORS.weak }]}
        />
        <Text style={styles.legendText}>Weak Soreness</Text>
      </View>
      <View style={styles.legendContainer}>
        <View
          style={[styles.legendItem, { backgroundColor: SORENESS_COLORS.none }]}
        />
        <Text style={styles.legendText}>No Soreness</Text>
      </View>
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
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
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
