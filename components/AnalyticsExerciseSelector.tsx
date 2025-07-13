import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Checkbox } from "expo-checkbox";
import { Exercise } from "../store/store"; // Убедитесь, что путь правильный

interface AnalyticsExerciseSelectorProps {
  isVisible: boolean;
  exercises: Exercise[];
  selectedExerciseIds: string[];
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
}

const AnalyticsExerciseSelector: React.FC<AnalyticsExerciseSelectorProps> = ({
  isVisible,
  exercises,
  selectedExerciseIds,
  onClose,
  onSave,
}) => {
  const [currentSelectedIds, setCurrentSelectedIds] =
    useState<string[]>(selectedExerciseIds);

  useEffect(() => {
    setCurrentSelectedIds(selectedExerciseIds);
  }, [selectedExerciseIds]);

  const handleCheckboxChange = (id: string) => {
    setCurrentSelectedIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter((exerciseId) => exerciseId !== id);
      } else {
        return [...prevSelectedIds, id];
      }
    });
  };

  const handleSave = () => {
    onSave(currentSelectedIds);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Выберите упражнения</Text>
          <ScrollView style={styles.scrollView}>
            {exercises.map((exercise) => (
              <View key={exercise.id} style={styles.checkboxContainer}>
                <Checkbox
                  value={currentSelectedIds.includes(exercise.id)}
                  onValueChange={() => handleCheckboxChange(exercise.id)}
                  color={
                    currentSelectedIds.includes(exercise.id)
                      ? "#4630EB"
                      : undefined
                  }
                />
                <Text style={styles.checkboxLabel}>{exercise.name}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={onClose}
            >
              <Text style={styles.textStyle}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={handleSave}
            >
              <Text style={styles.textStyle}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    width: "100%",
  },
  checkboxContainer: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: "45%",
    alignItems: "center",
  },
  buttonClose: {
    backgroundColor: "#f44336",
  },
  buttonSave: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default AnalyticsExerciseSelector;
