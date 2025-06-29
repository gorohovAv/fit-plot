import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
} from "react-native";
import { Workout } from "../../components/Workout";
import { useNavigation } from "@react-navigation/native";
import { PlanSelector } from "../../components/PlanSelector";
import useStore, { Plan } from "../../store/store";

type Training = {
  id: string;
  name: string;
  exercises: any[];
  results: any[];
};

export default function WorkoutPlanScreen() {
  const navigation = useNavigation();
  const { plans, addPlan, removeTraining, addTraining } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
    plans[0] || null
  );
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingName, setTrainingName] = useState("");

  useEffect(() => {
    if (selectedPlan) {
      const updatedPlan = plans.find(
        (plan) => plan.planName === selectedPlan.planName
      );
      if (updatedPlan) {
        setSelectedPlan(updatedPlan);
      }
    }
  }, [plans]); // для нормального ререндера

  const handleAddTraining = () => {
    if (!selectedPlan || !trainingName.trim()) return;

    const newTraining: Training = {
      id: Date.now().toString(),
      name: trainingName,
      exercises: [],
      results: [],
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
    <View style={modalStyles.container}>
      <View style={modalStyles.modal}>
        <Text style={modalStyles.title}>Название тренировки</Text>
        <TextInput
          style={modalStyles.input}
          placeholder="Введите название"
          value={trainingName}
          onChangeText={setTrainingName}
        />
        <View style={modalStyles.buttons}>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.cancelButton]}
            onPress={() => setShowTrainingModal(false)}
          >
            <Text style={modalStyles.buttonText}>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.confirmButton]}
            onPress={handleAddTraining}
          >
            <Text style={modalStyles.buttonText}>Добавить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.planButton}
        onPress={() => {
          console.log("Button pressed, showPlanSelector:", !showPlanSelector);
          setShowPlanSelector(!showPlanSelector);
        }}
      >
        <Text style={styles.planButtonText}>
          {selectedPlan?.planName || "Выберите план"}
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
          <Text style={styles.emptyText}>
            {selectedPlan
              ? "Нет тренировок в плане"
              : "Выберите план для начала"}
          </Text>
        }
      />

      {selectedPlan && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowTrainingModal(true)}
        >
          <Text style={styles.addButtonText}>+ Добавить тренировку</Text>
        </TouchableOpacity>
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
    paddingBottom: 80,
  },
  planButton: {
    padding: 12,
    backgroundColor: "#f0f0f0",
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
    color: "#666",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    left: 20,
    padding: 16,
    backgroundColor: "#2196F3",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    backgroundColor: "white",
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
    borderColor: "#ccc",
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
    color: "white",
    fontWeight: "bold",
  },
});
