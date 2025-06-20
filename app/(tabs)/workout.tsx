import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
} from "react-native";
import { Exercise } from "../../components/Exercise";
import { useRoute } from "@react-navigation/native";

export default function WorkoutScreen() {
  const route = useRoute();
  const { workoutId } = route.params as { workoutId: string };
  const [exercises, setExercises] = useState([
    { name: "Жим лежа", reps: 0, sets: 0, completed: false },
  ]);
  const [newExerciseName, setNewExerciseName] = useState("");

  const addExercise = () => {
    if (newExerciseName.trim()) {
      setExercises([
        ...exercises,
        {
          name: newExerciseName,
          reps: 0,
          sets: 0,
          completed: false,
        },
      ]);
      setNewExerciseName("");
    }
  };

  const updateExercise = (index: number, updates: Partial<Exercise>) => {
    setExercises(
      exercises.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={exercises}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Exercise
            name={item.name}
            reps={item.reps}
            sets={item.sets}
            completed={item.completed}
            onRepsChange={(reps) => updateExercise(index, { reps })}
            onSetsChange={(sets) => updateExercise(index, { sets })}
            onComplete={() =>
              updateExercise(index, { completed: !item.completed })
            }
          />
        )}
      />

      <View style={styles.addExerciseContainer}>
        <TextInput
          style={styles.exerciseInput}
          placeholder="Название упражнения"
          value={newExerciseName}
          onChangeText={setNewExerciseName}
        />
        <TouchableOpacity style={styles.addButton} onPress={addExercise}>
          <Text>Добавить упражнение</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... стили ...
});
