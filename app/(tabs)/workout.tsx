import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  StyleSheet,
  Modal,
} from "react-native";
import { Exercise } from "../../components/Exercise";
import { useRoute } from "@react-navigation/native";
import useStore from "../../store/store";
import { Picker } from "@react-native-picker/picker";

export default function WorkoutScreen() {
  const route = useRoute();
  const { workoutId, planName } = route.params as {
    workoutId: string;
    planName: string;
  };
  const { plans, addExercise } = useStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroup: "chest" as MuscleGroup,
    type: "free weight" as ExerciseType,
    unilateral: false,
  });

  const currentTraining = plans
    .find((plan) => plan.planName === planName)
    ?.trainings.find((training) => training.id === workoutId);

  const handleAddExercise = () => {
    if (newExercise.name.trim()) {
      const exercise: Exercise = {
        id: Date.now().toString(),
        ...newExercise,
      };
      console.log(
        "Adding exercise:",
        exercise,
        "to plan:",
        planName,
        "training:",
        workoutId
      );
      addExercise(planName, workoutId, exercise);
      setNewExercise({
        name: "",
        muscleGroup: "chest",
        type: "free weight",
        unilateral: false,
      });
      setIsModalVisible(false);
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
        data={currentTraining?.exercises || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Exercise
            id={item.id}
            name={item.name}
            muscleGroup={item.muscleGroup}
            type={item.type}
            unilateral={item.unilateral}
            reps={0}
            sets={0}
            onRepsChange={() => {}}
            onSetsChange={() => {}}
            onComplete={() => {}}
            completed={false}
          />
        )}
      />

      {/* Кнопка для открытия модального окна */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Модальное окно */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить упражнение</Text>

            <TextInput
              style={styles.input}
              placeholder="Название упражнения"
              value={newExercise.name}
              onChangeText={(text) =>
                setNewExercise({ ...newExercise, name: text })
              }
            />

            <Picker
              selectedValue={newExercise.muscleGroup}
              onValueChange={(value) =>
                setNewExercise({ ...newExercise, muscleGroup: value })
              }
            >
              <Picker.Item label="Грудь" value="chest" />
              <Picker.Item label="Трицепс" value="triceps" />
              <Picker.Item label="Бицепс" value="biceps" />
              <Picker.Item label="Предплечья" value="forearms" />
              <Picker.Item label="Плечи" value="delts" />
              <Picker.Item label="Спина" value="back" />
              <Picker.Item label="Ягодицы" value="glutes" />
              <Picker.Item label="Квадрицепсы" value="quads" />
              <Picker.Item label="Бицепс бедра" value="hamstrings" />
              <Picker.Item label="Икры" value="calves" />
            </Picker>

            <Picker
              selectedValue={newExercise.type}
              onValueChange={(value) =>
                setNewExercise({ ...newExercise, type: value })
              }
            >
              <Picker.Item label="Тренажёр" value="machine" />
              <Picker.Item label="Свободные веса" value="free weight" />
              <Picker.Item label="Собственный вес" value="own weight" />
              <Picker.Item label="Тросы" value="cables" />
            </Picker>

            <TouchableOpacity
              style={styles.unilateralButton}
              onPress={() =>
                setNewExercise({
                  ...newExercise,
                  unilateral: !newExercise.unilateral,
                })
              }
            >
              <Text>
                {newExercise.unilateral ? "Одностороннее" : "Двустороннее"}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddExercise}
              >
                <Text>Добавить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1976d2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  addButtonText: {
    fontSize: 30,
    color: "white",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  unilateralButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  submitButton: {
    padding: 10,
    backgroundColor: "#1976d2",
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
});
