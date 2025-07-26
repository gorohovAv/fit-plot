import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColor } from "../hooks/useThemeColor";

type WorkoutProps = {
  title: string;
  onPress: () => void;
  onDelete: () => void;
};

export const Workout: React.FC<WorkoutProps> = ({
  title,
  onPress,
  onDelete,
}) => {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity onPress={onPress} style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <MaterialIcons name="close" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
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
