import React from "react";
import { View, Text, StyleSheet } from "react-native";

type ExerciseProps = {
  name: string;
  reps: number;
  sets: number;
};

export const Exercise: React.FC<ExerciseProps> = ({ name, reps, sets }) => (
  <View style={styles.container}>
    <Text style={styles.name}>{name}</Text>
    <Text>
      {sets} x {reps}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 8, borderBottomWidth: 1, borderColor: "#eee" },
  name: { fontWeight: "bold" },
});
