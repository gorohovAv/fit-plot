import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Appearance,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import useStore, { Plan, Exercise, PlannedResult } from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Colors } from "../../constants/Colors";
import useSettingsStore from "../../store/settingsStore";
import { getTranslation } from "../../utils/localization";
import * as dbLayer from "../../store/dbLayer";

export default function PlanScreen() {
  const route = useRoute();
  const { planName } = route.params as { planName: string };
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlannedResult, setNewPlannedResult] = useState({
    plannedWeight: "",
    plannedReps: "",
    plannedDate: new Date().toISOString().split("T")[0],
    amplitude: "full" as "full" | "partial",
  });
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      await dbLayer.initDatabase();
      const loadedPlans = await dbLayer.getAllPlansWithData();
      setPlans(loadedPlans);
    } catch (error) {
      console.error("Ошибка загрузки планов:", error);
    }
  };

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

  const currentPlan = plans.find((plan) => plan.planName === planName);
  const allExercises =
    currentPlan?.trainings.flatMap((training) => training.exercises) || [];

  const handleAddPlannedResult = async () => {
    if (
      selectedExercise &&
      newPlannedResult.plannedWeight &&
      newPlannedResult.plannedReps
    ) {
      try {
        await dbLayer.savePlannedResult({
          exerciseId: selectedExercise,
          plannedWeight: parseFloat(newPlannedResult.plannedWeight),
          plannedReps: parseInt(newPlannedResult.plannedReps),
          plannedDate: newPlannedResult.plannedDate,
          amplitude: newPlannedResult.amplitude,
        });

        await loadPlans();
        setNewPlannedResult({
          plannedWeight: "",
          plannedReps: "",
          plannedDate: new Date().toISOString().split("T")[0],
          amplitude: "full",
        });
        setSelectedExercise("");
        setShowAddModal(false);
      } catch (error) {
        console.error("Ошибка сохранения планового результата:", error);
      }
    }
  };

  const groupedPlannedResults: Record<string, PlannedResult[]> = {};

  currentPlan?.trainings.forEach((training) => {
    training.plannedResults.forEach((plannedResult) => {
      const exercise = training.exercises.find(
        (ex) => ex.id === plannedResult.exerciseId
      );
      if (exercise) {
        if (!groupedPlannedResults[exercise.name]) {
          groupedPlannedResults[exercise.name] = [];
        }
        groupedPlannedResults[exercise.name].push(plannedResult);
      }
    });
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {getTranslation(language, "resultsPlanning")} - {planName}
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeColors.tint }]}
            onPress={() => setShowAddModal(true)}
          >
            <MaterialIcons name="add" size={24} color={themeColors.card} />
            <Text style={[styles.addButtonText, { color: themeColors.card }]}>
              {getTranslation(language, "addPlannedResult")}
            </Text>
          </TouchableOpacity>
        </View>

        {Object.entries(groupedPlannedResults).map(
          ([exerciseName, plannedResults]) => (
            <View
              key={exerciseName}
              style={[
                styles.exerciseGroup,
                { backgroundColor: themeColors.card },
              ]}
            >
              <Text style={[styles.exerciseName, { color: themeColors.text }]}>
                {exerciseName}
              </Text>
              {plannedResults.map((plannedResult, index) => (
                <View
                  key={index}
                  style={[
                    styles.plannedResult,
                    { backgroundColor: themeColors.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.plannedResultText,
                      { color: themeColors.text },
                    ]}
                  >
                    {plannedResult.plannedWeight} кг ×{" "}
                    {plannedResult.plannedReps} повторений
                  </Text>
                  <Text
                    style={[
                      styles.plannedResultDate,
                      { color: themeColors.icon },
                    ]}
                  >
                    {new Date(plannedResult.plannedDate).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )
        )}

        {Object.keys(groupedPlannedResults).length === 0 && (
          <Text style={[styles.emptyText, { color: themeColors.icon }]}>
            {getTranslation(language, "noPlannedResults")}
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
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
                {getTranslation(language, "addPlannedResult")}
              </Text>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedExercise}
                  onValueChange={(itemValue) => setSelectedExercise(itemValue)}
                  style={[
                    styles.picker,
                    {
                      color: themeColors.text,
                      backgroundColor: themeColors.background,
                    },
                  ]}
                >
                  <Picker.Item label="Выберите упражнение" value="" />
                  {allExercises.map((exercise) => (
                    <Picker.Item
                      key={exercise.id}
                      label={exercise.name}
                      value={exercise.id}
                    />
                  ))}
                </Picker>
              </View>

              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: themeColors.border,
                    color: themeColors.text,
                    backgroundColor: themeColors.background,
                  },
                ]}
                placeholder="Планируемый вес (кг)"
                placeholderTextColor={themeColors.icon}
                value={newPlannedResult.plannedWeight}
                onChangeText={(text) =>
                  setNewPlannedResult({
                    ...newPlannedResult,
                    plannedWeight: text,
                  })
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
                placeholder="Планируемые повторения"
                placeholderTextColor={themeColors.icon}
                value={newPlannedResult.plannedReps}
                onChangeText={(text) =>
                  setNewPlannedResult({
                    ...newPlannedResult,
                    plannedReps: text,
                  })
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
                placeholder="Планируемая дата (YYYY-MM-DD)"
                placeholderTextColor={themeColors.icon}
                value={newPlannedResult.plannedDate}
                onChangeText={(text) =>
                  setNewPlannedResult({
                    ...newPlannedResult,
                    plannedDate: text,
                  })
                }
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: themeColors.error },
                  ]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: themeColors.card },
                    ]}
                  >
                    {getTranslation(language, "cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: themeColors.success },
                  ]}
                  onPress={handleAddPlannedResult}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      { color: themeColors.card },
                    ]}
                  >
                    {getTranslation(language, "add")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ... existing styles ...
