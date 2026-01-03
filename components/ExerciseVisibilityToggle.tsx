import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";

interface ExerciseVisibilityToggleProps {
  exerciseId: string;
  hidden: boolean;
  onToggle: (exerciseId: string, hidden: boolean) => void;
}

export const ExerciseVisibilityToggle: React.FC<
  ExerciseVisibilityToggleProps
> = ({ exerciseId, hidden, onToggle }) => {
  const theme = useSettingsStore((state) => state.theme);
  let colorScheme: "light" | "dark" = "light";
  if (theme === "dark") {
    colorScheme = "dark";
  } else if (theme === "light") {
    colorScheme = "light";
  } else {
    colorScheme = "light";
  }
  const themeColors = Colors[colorScheme];

  return (
    <TouchableOpacity
      onPress={() => onToggle(exerciseId, !hidden)}
      style={styles.button}
    >
      <MaterialIcons
        name={hidden ? "visibility-off" : "visibility"}
        size={20}
        color={themeColors.icon}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 20,
  },
});
