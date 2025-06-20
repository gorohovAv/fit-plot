import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Workout } from "../../components/Workout";
import { useNavigation } from "@react-navigation/native";
import { PlanSelector } from "../../components/PlanSelector";
import useStore, { Plan } from "../../store/store";

export default function WorkoutPlanScreen() {
  const navigation = useNavigation();
  const { plans, addPlan, addTraining } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(
    plans[0] || null
  );
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  const handleAddTraining = () => {
    if (!selectedPlan) return;

    const newTraining: Training = {
      id: Date.now().toString(),
      name: `Тренировка ${selectedPlan.trainings.length + 1}`,
      exercises: [],
      results: [],
    };

    addTraining(selectedPlan.planName, newTraining);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.planButton}
        onPress={() => setShowPlanSelector(true)}
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
              navigation.navigate("workout", { workoutId: item.id } as never)
            }
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddTraining}>
          <Text style={styles.addButtonText}>+ Добавить тренировку</Text>
        </TouchableOpacity>
      )}

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
