import React from "react";
import { View, FlatList } from "react-native";
import { Workout } from "../../components/Workout";
import { useNavigation } from "@react-navigation/native";

const workouts = [
  { id: "1", title: "Грудь и трицепс" },
  { id: "2", title: "Спина и бицепс" },
  { id: "3", title: "Ноги" },
];

export default function WorkoutPlanScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Workout
            title={item.title}
            onPress={() =>
              navigation.navigate("workout", { workoutId: item.id })
            }
          />
        )}
      />
    </View>
  );
}
