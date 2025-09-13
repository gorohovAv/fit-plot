import { getTranslation } from "@/utils/localization";
import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";

interface TrainingModalProps {
  visible: boolean;
  trainingName: string;
  onTrainingNameChange: (name: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export const TrainingModal: React.FC<TrainingModalProps> = ({
  visible,
  trainingName,
  onTrainingNameChange,
  onAdd,
  onCancel,
}) => {
  const theme = useSettingsStore((state) => state.theme);
  const { language } = useSettingsStore();

  const colorScheme =
    theme === "dark"
      ? Colors.dark
      : theme === "light"
      ? Colors.light
      : Colors.light;

  if (!visible) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <View style={[styles.modal, { backgroundColor: colorScheme.card }]}>
        <Text style={[styles.title, { color: colorScheme.text }]}>
          {getTranslation(language, "workoutName")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colorScheme.border,
              color: colorScheme.text,
              backgroundColor: colorScheme.background,
            },
          ]}
          placeholder={getTranslation(language, "enterName")}
          placeholderTextColor={colorScheme.textSecondary}
          value={trainingName}
          onChangeText={onTrainingNameChange}
          onSubmitEditing={onAdd}
          blurOnSubmit={false}
          autoFocus={true}
        />
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>
              {getTranslation(language, "cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={onAdd}
          >
            <Text style={styles.buttonText}>
              {getTranslation(language, "add")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    borderRadius: 8,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    fontWeight: "bold",
  },
});
