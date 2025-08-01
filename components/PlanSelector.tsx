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
  const { plans, addPlan, removePlan } = useStore();
  const [newPlanName, setNewPlanName] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const theme = useSettingsStore((state) => state.theme);
  const colorScheme =
    theme === "dark"
      ? Colors.dark
      : theme === "light"
      ? Colors.light
      : Colors.light;
  const themeColors = colorScheme;

  const handleAddPlan = () => {
    if (newPlanName.trim()) {
      const newPlan: Plan = {
        planName: newPlanName,
        trainings: [],
      };
      addPlan(newPlan);
      onSelect(newPlan);
      setNewPlanName("");
      setShowAddModal(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalContainer,
          { backgroundColor: "rgba(0, 0, 0, 0.5)" },
        ]}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Выберите план
          </Text>

          <FlatList
            data={plans}
            keyExtractor={(item) => item.planName}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.planItem,
                  {
                    borderBottomColor: themeColors.border,
                  },
                ]}
                onPress={() => onSelect(item)}
              >
                <Text style={[styles.planName, { color: themeColors.text }]}>
                  {item.planName}
                </Text>
                <Text style={[styles.planCount, { color: themeColors.icon }]}>
                  {item.trainings.length} тренировок
                </Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: themeColors.tint }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={[styles.buttonText, { color: themeColors.card }]}>
                Добавить план
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: themeColors.chartGrid },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: themeColors.text }]}>
                Отмена
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showAddModal && (
          <View
            style={[
              styles.addModalContainer,
              { backgroundColor: "rgba(0, 0, 0, 0.5)" },
            ]}
          >
            <View
              style={[
                styles.addModalContent,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.addModalTitle, { color: themeColors.text }]}>
                Новый план
              </Text>
              <TextInput
                style={[
                  styles.addModalInput,
                  {
                    borderColor: themeColors.border,
                    color: themeColors.text,
                    backgroundColor: themeColors.card,
                  },
                ]}
                placeholder="Название плана"
                placeholderTextColor={themeColors.icon}
                value={newPlanName}
                onChangeText={setNewPlanName}
              />
              <View style={styles.addModalButtons}>
                <TouchableOpacity
                  style={[
                    styles.addModalButton,
                    { backgroundColor: themeColors.error },
                  ]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text
                    style={[
                      styles.addModalButtonText,
                      { color: themeColors.card },
                    ]}
                  >
                    Отмена
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.addModalButton,
                    { backgroundColor: themeColors.success },
                  ]}
                  onPress={handleAddPlan}
                >
                  <Text
                    style={[
                      styles.addModalButtonText,
                      { color: themeColors.card },
                    ]}
                  >
                    Добавить
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    borderRadius: 10,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    padding: 20,
  },
  planItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  planCount: {
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  addButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  addModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  addModalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  addModalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  addModalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  addModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addModalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
