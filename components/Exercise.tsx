import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

type ExerciseProps = {
  name: string;
  reps: number;
  sets: number;
  onRepsChange: (reps: number) => void;
  onSetsChange: (sets: number) => void;
  onComplete: () => void;
  completed: boolean;
};

export const Exercise: React.FC<ExerciseProps> = ({
  name,
  reps,
  sets,
  onRepsChange,
  onSetsChange,
  onComplete,
  completed,
}) => {
  const [editing, setEditing] = useState(false);

  return (
    <View style={[styles.container, completed && styles.completed]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editButton}>
            {editing ? "Готово" : "Изменить"}
          </Text>
        </TouchableOpacity>
      </View>

      {editing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={sets.toString()}
            onChangeText={(text) => onSetsChange(parseInt(text) || 0)}
          />
          <Text style={styles.xSymbol}>×</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={reps.toString()}
            onChangeText={(text) => onRepsChange(parseInt(text) || 0)}
          />
        </View>
      ) : (
        <Text style={styles.setsReps}>
          {sets} × {reps}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.completeButton, completed && styles.completedButton]}
        onPress={onComplete}
      >
        <Text style={styles.completeButtonText}>
          {completed ? "✓ Выполнено" : "Завершить"}
        </Text>
      </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  editButton: {
    color: "#1976d2",
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    width: 50,
    textAlign: "center",
  },
  xSymbol: {
    marginHorizontal: 8,
  },
  setsReps: {
    fontSize: 16,
    marginBottom: 8,
  },
  completeButton: {
    padding: 8,
    backgroundColor: "#1976d2",
    borderRadius: 4,
    alignItems: "center",
  },
  completedButton: {
    backgroundColor: "#4caf50",
  },
  completeButtonText: {
    color: "white",
  },
});
