import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Appearance,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Exercise as ExerciseComponent } from "../../components/Exercise";
import ExerciseModal from "../../components/ExerciseModal";
import { TrainingSettings } from "../../components/TrainingSettings";
import { Colors } from "../../constants/Colors";
import * as dbLayer from "../../store/dbLayer";
import useSettingsStore from "../../store/settingsStore";
import { Exercise, ExerciseType, MuscleGroup } from "../../store/store";

export default function WorkoutScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const {
    workoutId,
    planName,
    showSettings: initialShowSettings,
  } = route.params as {
    workoutId: string;
    planName: string;
    showSettings?: boolean;
  };
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(
    initialShowSettings || false,
  );
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroup: "chest" as MuscleGroup,
    type: "free weight" as ExerciseType,
    unilateral: false,
    amplitude: "full" as "full" | "partial",
    comment: "",
    timerDuration: undefined as number | undefined,
    right: undefined as boolean | undefined,
  });
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const previousShowSettings = useRef<boolean>(initialShowSettings || false);

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

  const loadExercises = async () => {
    console.log("[WorkoutScreen] loadExercises called, workoutId:", workoutId);
    try {
      const loadedExercises = await dbLayer.getExercisesByTraining(workoutId);
      console.log(
        "[WorkoutScreen] Получили упражнения, количество:",
        loadedExercises?.length || 0,
      );
      console.log(
        "[WorkoutScreen] Упражнения hidden:",
        loadedExercises?.map((e: any) => ({
          id: e.id,
          name: e.name,
          hidden: e.hidden,
        })),
      );
      setExercises(loadedExercises);
      console.log("[WorkoutScreen] Упражнения установлены в state");
    } catch (error) {
      console.error("[WorkoutScreen] Ошибка загрузки упражнений из БД:", error);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [workoutId]);

  useEffect(() => {
    if (initialShowSettings) {
      setShowSettings(true);
    }
  }, [initialShowSettings]);

  useEffect(() => {
    if (previousShowSettings.current && !showSettings) {
      loadExercises();

      navigation.setParams?.({ showSettings: false } as any);
    }
    previousShowSettings.current = showSettings;
  }, [showSettings, navigation]);

  const handleAddEditExercise = async (exerciseData: typeof newExercise) => {
    if (exerciseData.name.trim()) {
      if (editingExercise) {
        const updatedExercise: Exercise = {
          ...editingExercise,
          ...exerciseData,
        };

        await dbLayer.saveExercise({
          ...updatedExercise,
          trainingId: workoutId,
        });
      } else {
        const exercise: Exercise = {
          id: Date.now().toString(),
          ...exerciseData,
        };

        await dbLayer.saveExercise({
          ...exercise,
          trainingId: workoutId,
          hidden: false,
        });
      }
      setNewExercise({
        name: "",
        muscleGroup: "chest",
        type: "free weight",
        unilateral: false,
        amplitude: "full",
        comment: "",
        timerDuration: undefined,
        right: undefined,
      });
      setEditingExercise(null);
      setIsModalVisible(false);

      await loadExercises();
    }
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setNewExercise({
      name: exercise.name || "",
      muscleGroup: exercise.muscleGroup || "chest",
      type: exercise.type || "free weight",
      unilateral: exercise.unilateral || false,
      amplitude: exercise.amplitude || "full",
      comment: exercise.comment || "",
      timerDuration: exercise.timerDuration ?? undefined,
      right: exercise.right,
    });
    setIsModalVisible(true);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    await dbLayer.deleteExercise(exerciseId);

    await loadExercises();
  };

  const handleToggleHidden = async (exerciseId: string, newHidden: boolean) => {
    console.log(
      "[WorkoutScreen] toggle hidden from card:",
      exerciseId,
      "->",
      newHidden,
    );
    await dbLayer.updateExerciseHidden(exerciseId, newHidden);
    await loadExercises();
  };

  if (showSettings) {
    return (
      <TrainingSettings
        trainingId={workoutId}
        exercises={exercises}
        onBack={() => {
          setShowSettings(false);
          navigation.setParams?.({ showSettings: false } as any);
        }}
      />
    );
  }

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
          data={exercises.filter((ex: any) => !ex.hidden)}
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
              hidden={item.hidden}
              right={item.right}
              onToggleHidden={handleToggleHidden}
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
              comment: "",
              timerDuration: undefined,
              right: undefined,
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
