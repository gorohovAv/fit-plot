import React from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ValidationStatus = "empty" | "valid" | "invalid";

interface ImportValidatorProps {
  status: ValidationStatus;
  errorMessage?: string;
  warningMessage?: string;
}

export function ImportValidator({
  status,
  errorMessage,
  warningMessage,
}: ImportValidatorProps) {
  const backgroundColor = useThemeColor({}, "background");
  const iconColor = useThemeColor({}, "text");

  const getIconName = () => {
    switch (status) {
      case "empty":
        return "help-circle-outline";
      case "valid":
        return "checkmark-circle-outline";
      case "invalid":
        return "close-circle-outline";
    }
  };

  const getIconColor = () => {
    switch (status) {
      case "empty":
        return "#8E8E93";
      case "valid":
        return "#FFD700";
      case "invalid":
        return "#FF3B30";
    }
  };

  const handlePress = () => {
    if (status === "invalid" && errorMessage) {
      Alert.alert("Ошибка валидации", errorMessage);
    } else if (status === "valid" && warningMessage) {
      Alert.alert("Предупреждение", warningMessage);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]}
      onPress={handlePress}
      disabled={status === "empty"}
    >
      <Ionicons name={getIconName() as any} size={24} color={getIconColor()} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
});
