import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Plan } from "../store/store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useThemeColor } from "../hooks/useThemeColor";

type ResultsListProps = {
  plans: Plan[];
};

const ResultsList: React.FC<ResultsListProps> = ({ plans }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const groupedResults = plans
    .flatMap((plan) =>
      plan.trainings.flatMap((training) =>
        training.results.map((result) => {
          const exercise = training.exercises.find(
            (ex) => ex.id === result.exerciseId
          );
          return {
            ...result,
            muscleGroup: exercise?.muscleGroup || "unknown",
            exerciseName: exercise?.name || "unknown",
          };
        })
      )
    )
    .reduce((acc, result) => {
      if (!acc[result.muscleGroup]) {
        acc[result.muscleGroup] = {};
      }
      if (!acc[result.muscleGroup][result.exerciseName]) {
        acc[result.muscleGroup][result.exerciseName] = [];
      }
      acc[result.muscleGroup][result.exerciseName].push(result);
      return acc;
    }, {} as Record<string, Record<string, (typeof groupedResults)[0][]>>);

  const backgroundColor = useThemeColor({}, "background");
  const groupHeaderColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const resultBg = useThemeColor({}, "background");

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {Object.entries(groupedResults).map(([muscleGroup, exercises]) => (
        <View key={muscleGroup} style={styles.group}>
          <TouchableOpacity
            onPress={() => toggleGroup(muscleGroup)}
            style={[styles.groupHeader, { backgroundColor: groupHeaderColor }]}
          >
            <Text style={[styles.groupTitle, { color: textColor }]}>
              {muscleGroup}
            </Text>
            <MaterialIcons
              name={expandedGroups[muscleGroup] ? "expand-less" : "expand-more"}
              size={24}
              color={textColor}
            />
          </TouchableOpacity>
          {expandedGroups[muscleGroup] && (
            <View style={styles.exercisesContainer}>
              {Object.entries(exercises).map(([exerciseName, results]) => (
                <View key={exerciseName} style={styles.exercise}>
                  <Text style={[styles.exerciseTitle, { color: textColor }]}>
                    {exerciseName}
                  </Text>
                  {results.map((result, index) => (
                    <View
                      key={index}
                      style={[styles.result, { backgroundColor: resultBg }]}
                    >
                      <Text style={{ color: textColor }}>
                        {result.date}: {result.weight} кг × {result.reps}{" "}
                        повторений
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  group: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 4,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  exercisesContainer: {
    marginTop: 8,
    paddingLeft: 16,
  },
  exercise: {
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  result: {
    padding: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
});

export default ResultsList;
