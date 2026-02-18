import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/Colors";
import { useThemeColor } from "../hooks/useThemeColor";
import useSettingsStore from "../store/settingsStore";

type WorkoutProps = {
  title: string;
  onPress: () => void;
  onDelete: () => void;
  onSettings?: () => void;
};

export const Workout: React.FC<WorkoutProps> = ({
  title,
  onPress,
  onDelete,
  onSettings,
}) => {
  const theme = useSettingsStore((state) => state.theme);
   const colorScheme =
      theme === "dark"
        ? Colors.dark
        : theme === "light"
          ? Colors.light
          : Colors.light;
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const errorColor = useThemeColor({}, "error");
  const iconColor = useThemeColor({}, "icon");

  return (
    <View style={[styles.container, { backgroundColor: colorScheme.card }]}>
      {onSettings && (
        <TouchableOpacity onPress={onSettings} style={styles.settingsButton}>
          <MaterialIcons name="settings" size={24} color={iconColor} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onPress} style={styles.titleContainer}>
        <Text style={[styles.title, { color: colorScheme.text }]}>{title}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <MaterialIcons name="close" size={24} color={errorColor} />
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
  settingsButton: {
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  deleteButton: {
    marginLeft: 8,
  },
});
