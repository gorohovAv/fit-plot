import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

type ExerciseProps = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  unilateral: boolean;
  reps: number;
  sets: number;
  onRepsChange: (reps: number) => void;
  onSetsChange: (sets: number) => void;
  onComplete: () => void;
  completed: boolean;
};

export const Exercise: React.FC<ExerciseProps> = ({
  id,
  name,
  muscleGroup,
  type,
  unilateral,
  reps,
  sets,
  onRepsChange,
  onSetsChange,
  onComplete,
  completed,
}) => {
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState({
    weight: 0,
    reps: 0,
  });

  const handleAddResult = () => {
    const newResult: Result = {
      exerciseId: id,
      weight: result.weight,
      reps: result.reps,
      date: new Date().toISOString(),
    };
    // Вызов метода хранилища для добавления результата
    setResult({ weight: 0, reps: 0 }); // Сброс полей
  };

  return (
    <View style={[styles.container, completed && styles.completed]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.details}>
          {muscleGroup} • {type} •{" "}
          {unilateral ? "Одностороннее" : "Двустороннее"}
        </Text>
      </View>

      {/* Форма ввода веса и повторений */}
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
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleAddResult}
        >
          <Text style={styles.confirmButtonText}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* История результатов (если нужно) */}
      {/* ... */}
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
});
