import React from "react";
import { View, FlatList } from "react-native";
import { Exercise } from "../../components/Exercise";
import { useRoute } from "@react-navigation/native";

const exercisesByWorkout = {
  "1": [
    { name: "Жим лежа", reps: 10, sets: 4 },
    { name: "Отжимания", reps: 15, sets: 3 },
  ],
  "2": [
    { name: "Тяга штанги", reps: 8, sets: 4 },
    { name: "Подтягивания", reps: 10, sets: 3 },
  ],
  "3": [
    { name: "Приседания", reps: 12, sets: 4 },
    { name: "Выпады", reps: 10, sets: 3 },
  ],
};

export default function WorkoutScreen() {
  const route = useRoute();
  const { workoutId } = route.params as { workoutId: "1" | "2" | "3" };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={exercisesByWorkout[workoutId] || []}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <Exercise name={item.name} reps={item.reps} sets={item.sets} />
        )}
      />
    </View>
  );
}
