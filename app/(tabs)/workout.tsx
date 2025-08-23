import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Appearance,
} from "react-native";
import { Exercise as ExerciseComponent } from "../../components/Exercise";
import { useRoute } from "@react-navigation/native";
import useStore, {
  MuscleGroup,
  ExerciseType,
  Exercise,
  Plan,
} from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ExerciseModal from "../../components/ExerciseModal";
import { Colors } from "../../constants/Colors";
import useSettingsStore from "../../store/settingsStore";
import { getTranslation } from "../../utils/localization";
import * as dbLayer from "../../store/dbLayer";

export default function WorkoutScreen() {
  const route = useRoute();
  const { workoutId, planName } = route.params as {
    workoutId: string;
    planName: string;
  };
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroup: "chest" as MuscleGroup,
    type: "free weight" as ExerciseType,
    unilateral: false,
    amplitude: "full" as "full" | "partial",
  });
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
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

  const currentTraining = plans
    .find((plan) => plan.planName === planName)
    ?.trainings.find((training) => training.id === workoutId);

  const handleAddEditExercise = async (exerciseData: typeof newExercise) => {
    if (exerciseData.name.trim()) {
      try {
        if (editingExercise) {
          const updatedExercise: Exercise = {
            ...editingExercise,
            ...exerciseData,
          };
          await dbLayer.saveExercise({
            id: updatedExercise.id,
            trainingId: workoutId,
            name: updatedExercise.name,
            muscleGroup: updatedExercise.muscleGroup,
            type: updatedExercise.type,
            unilateral: updatedExercise.unilateral,
            amplitude: updatedExercise.amplitude,
            comment: updatedExercise.comment,
            timerDuration: updatedExercise.timerDuration,
          });
        } else {
          const exercise: Exercise = {
            id: Date.now().toString(),
            ...exerciseData,
          };
          await dbLayer.saveExercise({
            id: exercise.id,
            trainingId: workoutId,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            type: exercise.type,
            unilateral: exercise.unilateral,
            amplitude: exercise.amplitude,
          });
        }

        await loadPlans();
        setNewExercise({
          name: "",
          muscleGroup: "chest",
          type: "free weight",
          unilateral: false,
          amplitude: "full",
        });
        setEditingExercise(null);
        setIsModalVisible(false);
      } catch (error) {
        console.error("Ошибка сохранения упражнения:", error);
      }
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      type: exercise.type,
      unilateral: exercise.unilateral,
      amplitude: exercise.amplitude,
    });
    setIsModalVisible(true);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await dbLayer.deleteExercise(exerciseId);
      await loadPlans();
    } catch (error) {
      console.error("Ошибка удаления упражнения:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <FlatList
          data={currentTraining?.exercises || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseComponent
              exercise={item}
              onEdit={() => handleEditExercise(item)}
              onDelete={() => handleDeleteExercise(item.id)}
              planName={planName}
              trainingId={workoutId}
            />
          )}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: themeColors.text }]}>
              {getTranslation(language, "noExercises")}
            </Text>
          }
        />

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColors.tint }]}
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color={themeColors.card} />
          <Text style={[styles.addButtonText, { color: themeColors.card }]}>
            {getTranslation(language, "addExercise")}
          </Text>
        </TouchableOpacity>

        <ExerciseModal
          visible={isModalVisible}
          exercise={editingExercise}
          onClose={() => {
            setIsModalVisible(false);
            setEditingExercise(null);
            setNewExercise({
              name: "",
              muscleGroup: "chest",
              type: "free weight",
              unilateral: false,
              amplitude: "full",
            });
          }}
          onSave={handleAddEditExercise}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  amplitudeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    gap: 5,
  },
  unilateralButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  submitButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
});
