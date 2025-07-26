import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Appearance,
} from "react-native";
import useStore, { Plan } from "../store/store";
import useSettingsStore from "../store/settingsStore";
import { Colors } from "../constants/Colors";

type PlanSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (plan: Plan) => void;
};

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  console.log("PlanSelector rendered, visible:", visible);
  const { plans, addPlan } = useStore();
  const [newPlanName, setNewPlanName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const theme = useSettingsStore((state) => state.theme);
  const colorScheme =
    theme === "system" ? Appearance.getColorScheme?.() ?? "light" : theme;
  const colors = Colors[colorScheme];

  const handleCreatePlan = () => {
    if (newPlanName.trim()) {
      const newPlan: Plan = {
        planName: newPlanName,
        trainings: [],
      };
      addPlan(newPlan);
      onSelect(newPlan);
      setNewPlanName("");
      setShowAddForm(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Выберите план тренировок
          </Text>

          <FlatList
            data={plans}
            keyExtractor={(item) => item.planName}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.planItem}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.planText}>{item.planName}</Text>
              </TouchableOpacity>
            )}
          />

          {showAddForm ? (
            <View style={styles.addForm}>
              <TextInput
                style={styles.input}
                placeholder="Введите название плана"
                value={newPlanName}
                onChangeText={setNewPlanName}
                autoFocus
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.buttonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.createButton]}
                  onPress={handleCreatePlan}
                >
                  <Text style={styles.buttonText}>Создать</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.buttonText}>+ Новый план</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "70%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  planItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  planText: {
    fontSize: 16,
  },
  addForm: {
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  addButton: {
    backgroundColor: "#2196F3",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    flex: 1,
    marginLeft: 5,
  },
  cancelButton: {
    backgroundColor: "#f44336",
    flex: 1,
    marginRight: 5,
  },
  closeButton: {
    backgroundColor: "#9E9E9E",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
