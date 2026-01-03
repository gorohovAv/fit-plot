import { getTranslation } from "@/utils/localization";
import { Checkbox } from "expo-checkbox";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";
import { Exercise, PlannedResult } from "../store/store";

interface AnalyticsExerciseSelectorProps {
  isVisible: boolean;
  exercises: Exercise[];
  plannedResults: PlannedResult[];
  selectedExerciseIds: string[];
  selectedPlannedIds: string[];
  dateFilterStart: string;
  dateFilterEnd: string;
  onClose: () => void;
  onSave: (
    selectedIds: string[],
    selectedPlannedIds: string[],
    dateStart: string,
    dateEnd: string
  ) => void;
}

const AnalyticsExerciseSelector: React.FC<AnalyticsExerciseSelectorProps> = ({
  isVisible,
  exercises,
  plannedResults,
  selectedExerciseIds,
  selectedPlannedIds,
  dateFilterStart,
  dateFilterEnd,
  onClose,
  onSave,
}) => {
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);

  let colorScheme: "light" | "dark" = "light";
  if (theme === "dark") colorScheme = "dark";

  const themedStyles = getThemedStyles(Colors[colorScheme]);

  const [currentSelectedIds, setCurrentSelectedIds] =
    useState<string[]>(selectedExerciseIds);
  const [currentSelectedPlannedIds, setCurrentSelectedPlannedIds] =
    useState<string[]>(selectedPlannedIds);
  const [currentDateStart, setCurrentDateStart] =
    useState<string>(dateFilterStart);
  const [currentDateEnd, setCurrentDateEnd] = useState<string>(dateFilterEnd);

  useEffect(() => {
    setCurrentSelectedIds(selectedExerciseIds);
    setCurrentSelectedPlannedIds(selectedPlannedIds);
    setCurrentDateStart(dateFilterStart);
    setCurrentDateEnd(dateFilterEnd);
  }, [selectedExerciseIds, selectedPlannedIds, dateFilterStart, dateFilterEnd]);

  const handleCheckboxChange = (id: string) => {
    setCurrentSelectedIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter((exerciseId) => exerciseId !== id);
      } else {
        return [...prevSelectedIds, id];
      }
    });
  };

  const handlePlannedCheckboxChange = (id: string) => {
    setCurrentSelectedPlannedIds((prevSelectedIds) => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter((plannedId) => plannedId !== id);
      } else {
        return [...prevSelectedIds, id];
      }
    });
  };

  const handleSave = () => {
    onSave(
      currentSelectedIds,
      currentSelectedPlannedIds,
      currentDateStart,
      currentDateEnd
    );
    onClose();
  };

  const getExerciseNameById = (exerciseId: string) => {
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    return exercise ? exercise.name : "Неизвестное упражнение";
  };

  const groupedPlannedResults = plannedResults.reduce((acc, planned) => {
    const exerciseName = getExerciseNameById(planned.exerciseId);
    if (!acc[exerciseName]) {
      acc[exerciseName] = [];
    }
    acc[exerciseName].push(planned);
    return acc;
  }, {} as Record<string, PlannedResult[]>);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={themedStyles.centeredView}>
        <View style={themedStyles.modalView}>
          <Text style={themedStyles.modalTitle}>
            {getTranslation(language, "selectExercises")}
          </Text>
          <ScrollView style={themedStyles.scrollView}>
            <Text style={themedStyles.sectionTitle}>Фильтр по датам</Text>
            <View style={themedStyles.dateInputContainer}>
              <View style={themedStyles.dateInputGroup}>
                <Text style={themedStyles.dateLabel}>Начало</Text>
                <TextInput
                  value={currentDateStart}
                  onChangeText={setCurrentDateStart}
                  placeholder="YYYY-MM-DD"
                  style={themedStyles.dateInput}
                  placeholderTextColor={Colors[colorScheme].placeholderText}
                />
              </View>
              <View style={themedStyles.dateInputGroup}>
                <Text style={themedStyles.dateLabel}>Конец</Text>
                <TextInput
                  value={currentDateEnd}
                  onChangeText={setCurrentDateEnd}
                  placeholder="YYYY-MM-DD"
                  style={themedStyles.dateInput}
                  placeholderTextColor={Colors[colorScheme].placeholderText}
                />
              </View>
            </View>
            <Text style={themedStyles.sectionTitle}>Упражнения</Text>
            {exercises.map((exercise) => (
              <View key={exercise.id} style={themedStyles.checkboxContainer}>
                <Checkbox
                  value={currentSelectedIds.includes(exercise.id)}
                  onValueChange={() => handleCheckboxChange(exercise.id)}
                  color={
                    currentSelectedIds.includes(exercise.id)
                      ? Colors[colorScheme].tint
                      : undefined
                  }
                />
                <Text style={themedStyles.checkboxLabel}>{exercise.name}</Text>
              </View>
            ))}

            {Object.keys(groupedPlannedResults).length > 0 && (
              <>
                <Text style={themedStyles.sectionTitle}>
                  Плановые результаты
                </Text>
                {Object.entries(groupedPlannedResults).map(
                  ([exerciseName, plannedList]) => (
                    <View
                      key={`planned-${exerciseName}`}
                      style={themedStyles.checkboxContainer}
                    >
                      <Checkbox
                        value={currentSelectedPlannedIds.includes(
                          `planned-${exerciseName}`
                        )}
                        onValueChange={() =>
                          handlePlannedCheckboxChange(`planned-${exerciseName}`)
                        }
                        color={
                          currentSelectedPlannedIds.includes(
                            `planned-${exerciseName}`
                          )
                            ? Colors[colorScheme].tint
                            : undefined
                        }
                      />
                      <Text style={themedStyles.checkboxLabel}>
                        {exerciseName} - ПЛАН
                      </Text>
                    </View>
                  )
                )}
              </>
            )}
          </ScrollView>
          <View style={themedStyles.buttonContainer}>
            <TouchableOpacity
              style={[themedStyles.button, themedStyles.buttonClose]}
              onPress={onClose}
            >
              <Text style={themedStyles.textStyle}>
                {getTranslation(language, "cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[themedStyles.button, themedStyles.buttonSave]}
              onPress={handleSave}
            >
              <Text style={themedStyles.textStyle}>
                {getTranslation(language, "save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

function getThemedStyles(colors: typeof Colors.light) {
  return StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22,
      backgroundColor: colors.background,
    },
    modalView: {
      margin: 20,
      backgroundColor: colors.card,
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
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 15,
      marginBottom: 10,
      alignSelf: "flex-start",
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
      color: colors.text,
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
      backgroundColor: colors.error,
    },
    buttonSave: {
      backgroundColor: colors.tint,
    },
    textStyle: {
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
    },
    dateInputContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 15,
    },
    dateInputGroup: {
      flex: 1,
      marginRight: 8,
    },
    dateLabel: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
      opacity: 0.8,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      backgroundColor: colors.inputBackground || colors.card,
    },
  });
}

export default AnalyticsExerciseSelector;
