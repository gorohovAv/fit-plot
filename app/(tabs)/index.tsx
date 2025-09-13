import { getTranslation } from "@/utils/localization";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
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
import useSettingsStore from "../../store/settingsStore";
import useStore, { Plan, Training } from "../../store/store";

export default function WorkoutPlanScreen() {
  const navigation = useNavigation();
  const { plans, addPlan, removeTraining, addTraining } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
    plans[0] || null
  );
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

  useEffect(() => {
    if (selectedPlan) {
      const updatedPlan = plans.find(
        (plan) => plan.planName === selectedPlan.planName
      );
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      }
    }
  }, [plans]);

  const handleAddTraining = () => {
    if (!selectedPlan || !trainingName.trim()) return;

    const newTraining: Training = {
      id: Date.now().toString(),
      name: trainingName,
      exercises: [],
      results: [],
      plannedResults: [],
    };

    addTraining(selectedPlan.planName, newTraining);
    setTrainingName("");
    setShowTrainingModal(false);

    const updatedPlan = plans.find(
      (plan) => plan.planName === selectedPlan.planName
    );
    setSelectedPlan(updatedPlan || null);
  };

  const handleCancelTraining = () => {
    setShowTrainingModal(false);
    setTrainingName("");
  };

  const handleDeleteTraining = (trainingId: string) => {
    if (!selectedPlan) return;
    removeTraining(selectedPlan.planName, trainingId);
    const updatedPlan = plans.find(
      (plan) => plan.planName === selectedPlan.planName
    );
    setSelectedPlan(updatedPlan || null);
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
