import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import useStore from "../store/store";
import { useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

type ExerciseProps = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  unilateral: boolean;
  reps: number;
  sets: number;
  amplitude: "full" | "partial";
  onRepsChange: (reps: number) => void;
  onSetsChange: (sets: number) => void;
  onComplete: () => void;
  completed: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export const Exercise: React.FC<ExerciseProps> = ({
  id,
  name,
  muscleGroup,
  type,
  unilateral,
  reps,
  sets,
  amplitude,
  onRepsChange,
  onSetsChange,
  onComplete,
  completed,
  onEdit,
  onDelete,
}) => {
  const route = useRoute();
  const { workoutId, planName } = route.params as {
    workoutId: string;
    planName: string;
  };
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState({
    weight: 0,
    reps: 0,
    amplitude: "full" as "full" | "partial",
  });
  const { plans, addResult } = useStore();

  const exerciseResults =
    plans
      .find((plan) => plan.planName === planName)
      ?.trainings.find((training) => training.id === workoutId)
      ?.results.filter((res) => res.exerciseId === id) || [];

  const handleAddResult = () => {
    const newResult: Result = {
      exerciseId: id,
      weight: result.weight,
      reps: result.reps,
      amplitude: result.amplitude,
      date: new Date().toISOString(),
    };
    addResult(planName, workoutId, newResult);
    setResult({ weight: 0, reps: 0, amplitude: "full" });
  };

  return (
    <View style={[styles.container, completed && styles.completed]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.details}>
          {muscleGroup} • {type} •{" "}
          {unilateral ? "Одностороннее" : "Двустороннее"} •{" "}
          {amplitude === "full" ? "Полная амплитуда" : "Неполная амплитуда"}
        </Text>
      </View>

      {/* Кнопки редактирования и удаления */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Text>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Text>❌</Text>
        </TouchableOpacity>
      </View>

      {/* Список результатов */}
      {exerciseResults.length > 0 && (
        <View style={styles.resultsList}>
          {exerciseResults.map((res, index) => (
            <Text key={index} style={styles.resultItem}>
              {res.weight} кг × {res.reps} повторений
            </Text>
          ))}
        </View>
      )}

      {/* Форма ввода веса, повторений и амплитуды */}
      <View style={styles.resultForm}>
        <TextInput
          style={styles.weightInput}
          placeholder="Вес"
          keyboardType="numeric"
          value={result.weight.toString()}
          onChangeText={(text) =>
            setResult({ ...result, weight: parseFloat(text) || 0 })
          }
        />
        <Text style={styles.xSymbol}>×</Text>
        <TextInput
          style={styles.repsInput}
          placeholder="Повторения"
          keyboardType="numeric"
          value={result.reps.toString()}
          onChangeText={(text) =>
            setResult({ ...result, reps: parseInt(text) || 0 })
          }
        />
        <Picker
          selectedValue={result.amplitude}
          onValueChange={(value) => setResult({ ...result, amplitude: value })}
          style={styles.amplitudePicker}
        >
          <Picker.Item label="Полная" value="full" />
          <Picker.Item label="Неполная" value="partial" />
        </Picker>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleAddResult}
        >
          <Text style={styles.confirmButtonText}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
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
    color: "#666",
  },
  resultForm: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  weightInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  repsInput: {
    borderWidth: 1,
    borderColor: "#ddd",
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
    backgroundColor: "#4caf50",
    borderRadius: 4,
    width: 30,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
  },
  resultsList: {
    marginTop: 8,
  },
  resultItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  actions: {
    position: "absolute",
    right: 16,
    top: 16,
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  amplitudePicker: {
    width: 100,
    height: 40,
    marginLeft: 8,
  },
});
