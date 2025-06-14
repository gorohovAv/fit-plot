import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type WorkoutProps = {
  title: string;
  onPress: () => void;
};

export const Workout: React.FC<WorkoutProps> = ({ title, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.container}>
    <Text style={styles.title}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
    borderRadius: 8,
  },
  title: { fontSize: 18, fontWeight: "bold" },
});
