import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type WorkoutProps = {
  title: string;
  onPress: () => void;
  onDelete: () => void;
};

export const Workout: React.FC<WorkoutProps> = ({
  title,
  onPress,
  onDelete,
}) => (
  <View style={styles.container}>
    <TouchableOpacity onPress={onPress} style={styles.titleContainer}>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
      <MaterialIcons name="close" size={24} color="red" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    color: "black",
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  deleteButton: {
    marginLeft: 8,
  },
});
