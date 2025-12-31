import { getTranslation } from "@/utils/localization";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PlanSelector } from "../../components/PlanSelector";
import { TrainingModal } from "../../components/TrainingModal";
import { Workout } from "../../components/Workout";
import { Colors } from "../../constants/Colors";
import * as dbLayer from "../../store/dbLayer";
import useSettingsStore from "../../store/settingsStore";
import { Plan, Training } from "../../store/store";

export default function WorkoutPlanScreen() {
  const navigation = useNavigation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingName, setTrainingName] = useState("");
  const theme = useSettingsStore((state) => state.theme);
  const { language } = useSettingsStore();

  const colorScheme =
    theme === "dark"
      ? Colors.dark
      : theme === "light"
      ? Colors.light
      : Colors.light;

  // Функция для загрузки всех планов из БД
  const loadPlans = async () => {
    try {
      const planNames = await dbLayer.getAllPlans();
      const loadedPlans: Plan[] = [];

      for (const { planName } of planNames) {
        const trainings = await dbLayer.getTrainingsByPlan(planName);
        const planTrainings: Training[] = [];

        for (const training of trainings) {
          const exercises = await dbLayer.getExercisesByTraining(training.id);
          const exerciseIds = exercises.map((e) => e.id);
          const rows = await dbLayer.getResultsForExerciseIds(exerciseIds);

          const results: any[] = [];
          const plannedResults: any[] = [];
          for (const r of rows) {
            if (r.isPlanned) {
              plannedResults.push({
                exerciseId: r.exerciseId,
                plannedWeight: r.weight,
                plannedReps: r.reps,
                plannedDate: r.date,
                amplitude: r.amplitude,
              });
            } else {
              results.push({
                exerciseId: r.exerciseId,
                weight: r.weight,
                reps: r.reps,
                date: r.date,
                amplitude: r.amplitude,
              });
            }
          }

          planTrainings.push({
            id: training.id,
            name: training.name,
            exercises,
            results,
            plannedResults,
          });
        }

        loadedPlans.push({
          planName,
          trainings: planTrainings,
        });
      }

      setPlans(loadedPlans);
      // Устанавливаем первый план как выбранный, если он еще не выбран
      if (!selectedPlan && loadedPlans.length > 0) {
        setSelectedPlan(loadedPlans[0]);
      } else if (selectedPlan) {
        // Обновляем выбранный план, если он существует
        const updatedPlan = loadedPlans.find(
          (plan) => plan.planName === selectedPlan.planName
        );
        if (updatedPlan) {
          setSelectedPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки планов из БД:", error);
    }
  };

  // Загружаем планы при монтировании компонента и при фокусе экрана
  useEffect(() => {
    loadPlans();
  }, []);

  // Перезагружаем планы при возврате на экран (например, после импорта)
  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [])
  );

  const handleAddTraining = async () => {
    if (!selectedPlan || !trainingName.trim()) return;

    const newTraining: Training = {
      id: Date.now().toString(),
      name: trainingName,
      exercises: [],
      results: [],
      plannedResults: [],
    };

    // Сохраняем тренировку в БД
    await dbLayer.saveTraining(
      newTraining.id,
      selectedPlan.planName,
      newTraining.name
    );

    setTrainingName("");
    setShowTrainingModal(false);

    // Перезагружаем планы из БД
    await loadPlans();
  };

  const handleCancelTraining = () => {
    setShowTrainingModal(false);
    setTrainingName("");
  };

  const handleDeleteTraining = async (trainingId: string) => {
    if (!selectedPlan) return;

    // Удаляем тренировку из БД
    await dbLayer.deleteTraining(trainingId);

    // Перезагружаем планы из БД
    await loadPlans();
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colorScheme.background }]}
    >
      <TouchableOpacity
        style={[styles.planButton, { backgroundColor: colorScheme.card }]}
        onPress={() => {
          console.log("Button pressed, showPlanSelector:", !showPlanSelector);
          setShowPlanSelector(!showPlanSelector);
        }}
      >
        <Text style={[styles.planButtonText, { color: colorScheme.text }]}>
          {selectedPlan?.planName || getTranslation(language, "selectPlan")}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={selectedPlan?.trainings || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Workout
            title={item.name}
            onPress={() =>
              navigation.navigate("workout", {
                workoutId: item.id,
                planName: selectedPlan?.planName,
              })
            }
            onDelete={() => handleDeleteTraining(item.id)}
            onSettings={() =>
              navigation.navigate("workout", {
                workoutId: item.id,
                planName: selectedPlan?.planName,
                showSettings: true,
              })
            }
          />
        )}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colorScheme.text }]}>
            {selectedPlan
              ? getTranslation(language, "noWorkoutsInPlan")
              : getTranslation(language, "selectPlanToStart")}
          </Text>
        }
      />

      {selectedPlan && (
        <>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colorScheme.tint }]}
            onPress={() => setShowTrainingModal(true)}
          >
            <Text style={styles.addButtonText}>
              {getTranslation(language, "addWorkout")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.planScaleButton,
              { backgroundColor: colorScheme.success },
            ]}
            onPress={() =>
              navigation.navigate("plan", {
                planName: selectedPlan.planName,
              })
            }
          >
            <Text style={styles.planScaleButtonText}>
              {getTranslation(language, "resultsPlanning")}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TrainingModal
        visible={showTrainingModal}
        trainingName={trainingName}
        onTrainingNameChange={setTrainingName}
        onAdd={handleAddTraining}
        onCancel={handleCancelTraining}
      />
      <PlanSelector
        visible={showPlanSelector}
        onClose={() => setShowPlanSelector(false)}
        onSelect={(plan) => {
          setSelectedPlan(plan);
          setShowPlanSelector(false);
        }}
        plans={plans}
        onPlansChange={loadPlans}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 120,
  },
  planButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  planButtonText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
  },
  addButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    left: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    fontWeight: "bold",
  },
  planScaleButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    left: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  planScaleButtonText: {
    fontWeight: "bold",
  },
});
