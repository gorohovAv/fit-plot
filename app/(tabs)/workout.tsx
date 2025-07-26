import React, { useState } from "react";
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
} from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ExerciseModal from "../../components/ExerciseModal";
import { Colors } from "../../constants/Colors";
import useSettingsStore from "../../store/settingsStore";

export default function WorkoutScreen() {
  const route = useRoute();
  const { workoutId, planName } = route.params as {
    workoutId: string;
    planName: string;
  };
  const { plans, addExercise, updateExerciseInStore } = useStore();
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

  // определяем текущую тему
  let colorScheme: "light" | "dark" = "light";
  if (theme === "dark") {
    colorScheme = "dark";
  } else if (theme === "light") {
    colorScheme = "light";
  } else {
    // если system, пробуем взять из платформы, иначе по умолчанию светлая
    colorScheme =
      Platform.OS === "ios" || Platform.OS === "android"
        ? (Appearance.getColorScheme?.() as "light" | "dark") || "light"
        : "light";
  }
  const themeColors = Colors[colorScheme];

  const currentTraining = plans
    .find((plan) => plan.planName === planName)
    ?.trainings.find((training) => training.id === workoutId);

  const handleAddEditExercise = (exerciseData: typeof newExercise) => {
    if (exerciseData.name.trim()) {
      if (editingExercise) {
        const updatedExercise: Exercise = {
          ...editingExercise,
          ...exerciseData,
        };
        updateExerciseInStore(planName, workoutId, updatedExercise);
      } else {
        const exercise: Exercise = {
          id: Date.now().toString(),
          ...exerciseData,
        };
        addExercise(planName, workoutId, exercise);
      }
      setNewExercise({
        name: "",
        muscleGroup: "chest",
        type: "free weight",
        unilateral: false,
        amplitude: "full",
      });
      setEditingExercise(null);
      setIsModalVisible(false);
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

  const handleDeleteExercise = (exerciseId: string) => {
    const { removeExercise } = useStore.getState();
    removeExercise(planName, workoutId, exerciseId);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: themeColors.background }}
    >
      <View
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: themeColors.background,
        }}
      >
        <FlatList
          data={currentTraining?.exercises || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseComponent
              id={item.id}
              name={item.name}
              muscleGroup={item.muscleGroup}
              type={item.type}
              unilateral={item.unilateral}
              amplitude={item.amplitude}
              reps={0}
              sets={0}
              onRepsChange={() => {}}
              onSetsChange={() => {}}
              onComplete={() => {}}
              completed={false}
              onEdit={() => handleEditExercise(item)}
              onDelete={() => handleDeleteExercise(item.id)}
              timerDuration={item.timerDuration}
            />
          )}
        />

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeColors.tint }]}
          onPress={() => {
            setEditingExercise(null);
            setNewExercise({
              name: "",
              muscleGroup: "chest",
              type: "free weight",
              unilateral: false,
              amplitude: "full",
            });
            setIsModalVisible(true);
          }}
        >
          <Text style={[styles.addButtonText, { color: themeColors.card }]}>
            +
          </Text>
        </TouchableOpacity>

        <ExerciseModal
          visible={isModalVisible}
          onClose={() => {
            setIsModalVisible(false);
            setEditingExercise(null);
          }}
          onSubmit={handleAddEditExercise}
          initialExercise={editingExercise || newExercise}
          isEdit={!!editingExercise}
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
    backgroundColor: "#1976d2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: "white",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
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
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  amplitudeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 10,
    gap: 5,
  },
  unilateralButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
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
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  submitButton: {
    padding: 10,
    backgroundColor: "#1976d2",
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
});
