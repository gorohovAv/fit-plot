import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import PlanScale from "../../components/PlanScale";
import useStore from "../../store/store";

export default function PlanScaleScreen() {
  const route = useRoute();
  const { planName } = route.params as { planName: string };
  const plans = useStore((s) => s.plans);
  const plan = plans.find((p) => p.planName === planName);
  const trainings = plan?.trainings || [];

  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>План не найден</Text>
      </View>
    );
  }

  if (trainings.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>В этом плане нет тренировок</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Планирование результатов: {plan.planName}
      </Text>
      {trainings.map((training) => (
        <View key={training.id} style={styles.trainingBlock}>
          <Text style={styles.trainingTitle}>{training.name}</Text>
          <PlanScale planName={plan.planName} trainingId={training.id} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  trainingBlock: {
    marginBottom: 32,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
  },
  trainingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
