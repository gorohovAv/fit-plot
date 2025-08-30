import { getTranslation } from "@/utils/localization";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PlanSelector } from "../../components/PlanSelector";
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

  const handleDeleteTraining = (trainingId: string) => {
    if (!selectedPlan) return;
    removeTraining(selectedPlan.planName, trainingId);
    const updatedPlan = plans.find(
      (plan) => plan.planName === selectedPlan.planName
    );
    setSelectedPlan(updatedPlan || null);
  };

  const TrainingModal = () => (
    <View
      style={[modalStyles.container, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
    >
      <View style={[modalStyles.modal, { backgroundColor: colorScheme.card }]}>
        <Text style={[modalStyles.title, { color: colorScheme.text }]}>
          {getTranslation(language, "workoutName")}
        </Text>
        <TextInput
          style={[
            modalStyles.input,
            {
              borderColor: colorScheme.border,
              color: colorScheme.text,
              backgroundColor: colorScheme.background,
            },
          ]}
          placeholder={getTranslation(language, "enterName")}
          placeholderTextColor={colorScheme.textSecondary}
          value={trainingName}
          onChangeText={(text) => setTrainingName(text)}
          onSubmitEditing={() => {}}
          blurOnSubmit={false}
        />
        <View style={modalStyles.buttons}>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.cancelButton]}
            onPress={() => {
              setShowTrainingModal(false);
              setTrainingName("");
            }}
          >
            <Text style={modalStyles.buttonText}>
              {getTranslation(language, "cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.confirmButton]}
            onPress={handleAddTraining}
          >
            <Text style={modalStyles.buttonText}>
              {getTranslation(language, "add")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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

      {showTrainingModal && <TrainingModal />}
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

const modalStyles = StyleSheet.create({
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
