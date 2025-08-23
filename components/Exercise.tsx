import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Appearance,
} from "react-native";
import { Exercise as ExerciseType } from "../store/store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";
import { getTranslation } from "../utils/localization";
import * as dbLayer from "../store/dbLayer";

type ExerciseProps = {
  exercise: ExerciseType;
  onEdit: () => void;
  onDelete: () => void;
  planName: string;
  trainingId: string;
};

export const Exercise: React.FC<ExerciseProps> = ({
  exercise,
  onEdit,
  onDelete,
  planName,
  trainingId,
}) => {
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [newResult, setNewResult] = useState({
    weight: "",
    reps: "",
    date: new Date().toISOString().split("T")[0],
    amplitude: "full" as "full" | "partial",
  });
  const [showAddResultModal, setShowAddResultModal] = useState(false);
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);

  let colorScheme: "light" | "dark" = "light";
  if (theme === "dark") {
    colorScheme = "dark";
  } else if (theme === "light") {
    colorScheme = "light";
  } else {
    colorScheme =
      Platform.OS === "ios" || Platform.OS === "android"
        ? (Appearance.getColorScheme?.() as "light" | "dark") || "light"
        : "light";
  }
  const themeColors = Colors[colorScheme];

  const loadResults = async () => {
    try {
      const exerciseResults = await dbLayer.getResultsByExercise(exercise.id);
      setResults(exerciseResults);
    } catch (error) {
      console.error("Ошибка загрузки результатов:", error);
    }
  };

  const handleAddResult = async () => {
    if (newResult.weight && newResult.reps) {
      try {
        await dbLayer.saveResult({
          exerciseId: exercise.id,
          weight: parseFloat(newResult.weight),
          reps: parseInt(newResult.reps),
          date: newResult.date,
          amplitude: newResult.amplitude,
        });

        await loadResults();
        setNewResult({
          weight: "",
          reps: "",
          date: new Date().toISOString().split("T")[0],
          amplitude: "full",
        });
        setShowAddResultModal(false);
      } catch (error) {
        console.error("Ошибка сохранения результата:", error);
      }
    }
  };

  const handleToggleResults = () => {
    if (!showResults) {
      loadResults();
    }
    setShowResults(!showResults);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card }]}>
      <View style={styles.header}>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: themeColors.text }]}>
            {exercise.name}
          </Text>
          <Text style={[styles.exerciseDetails, { color: themeColors.icon }]}>
            {getTranslation(language, exercise.muscleGroup)} •{" "}
            {getTranslation(language, exercise.type)}
            {exercise.unilateral && " • Одностороннее"}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <MaterialIcons name="edit" size={20} color={themeColors.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <MaterialIcons name="delete" size={20} color={themeColors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.resultsToggle}
        onPress={handleToggleResults}
      >
        <Text style={[styles.resultsToggleText, { color: themeColors.tint }]}>
          {showResults ? "Скрыть результаты" : "Показать результаты"}
        </Text>
        <MaterialIcons
          name={showResults ? "expand-less" : "expand-more"}
          size={20}
          color={themeColors.tint}
        />
      </TouchableOpacity>

      {showResults && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: themeColors.text }]}>
              Результаты
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddResultModal(true)}
              style={styles.addResultButton}
            >
              <MaterialIcons name="add" size={20} color={themeColors.tint} />
            </TouchableOpacity>
          </View>

          {results.length > 0 ? (
            results.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.resultItem,
                  { backgroundColor: themeColors.background },
                ]}
              >
                <Text style={[styles.resultText, { color: themeColors.text }]}>
                  {result.weight} кг × {result.reps} повторений
                </Text>
                <Text style={[styles.resultDate, { color: themeColors.icon }]}>
                  {new Date(result.date).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noResults, { color: themeColors.icon }]}>
              Нет результатов
            </Text>
          )}
        </View>
      )}

      <Modal
        visible={showAddResultModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: themeColors.card },
              ]}
            >
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Добавить результат
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: themeColors.border,
                    color: themeColors.text,
                    backgroundColor: themeColors.background,
                  },
                ]}
                placeholder="Вес (кг)"
                placeholderTextColor={themeColors.icon}
                value={newResult.weight}
                onChangeText={(text) =>
                  setNewResult({ ...newResult, weight: text })
                }
                keyboardType="numeric"
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: themeColors.border,
                    color: themeColors.text,
                    backgroundColor: themeColors.background,
                  },
                ]}
                placeholder="Повторения"
                placeholderTextColor={themeColors.icon}
                value={newResult.reps}
                onChangeText={(text) =>
                  setNewResult({ ...newResult, reps: text })
                }
                keyboardType="numeric"
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: themeColors.border,
                    color: themeColors.text,
                    backgroundColor: themeColors.background,
                  },
                ]}
                placeholder="Дата (YYYY-MM-DD)"
                placeholderTextColor={themeColors.icon}
                value={newResult.date}
                onChangeText={(text) =>
                  setNewResult({ ...newResult, date: text })
                }
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: themeColors.error },
                  ]}
                  onPress={() => setShowAddResultModal(false)}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: themeColors.card },
                    ]}
                  >
                    Отмена
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: themeColors.success },
                  ]}
                  onPress={handleAddResult}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: themeColors.card },
                    ]}
                  >
                    Добавить
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 36,
    marginBottom: 12,
    borderRadius: 8,
    minHeight: 280,
    paddingRight: 80,
  },
  completed: {
    backgroundColor: "#e8f5e9",
  },
  header: {
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  details: {
    fontSize: 14,
  },
  resultForm: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  weightInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  repsInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  xSymbol: {
    marginHorizontal: 8,
  },
  confirmButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 4,
    width: 30,
    alignItems: "center",
  },
  resultsList: {
    marginTop: 8,
    minHeight: 40,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
  },
  actions: {
    position: "absolute",
    right: 12,
    top: 24,
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    padding: 20,
  },
  amplitudeToggle: {
    marginLeft: 8,
    padding: 4,
  },
  timerWrapper: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    minWidth: 48,
  },
  comment: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: "italic",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  exerciseDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  resultsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  resultsToggleText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  resultsContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  addResultButton: {
    padding: 4,
  },
  noResults: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  pickerContainer: {
    width: "100%",
    marginBottom: 15,
  },
  picker: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
