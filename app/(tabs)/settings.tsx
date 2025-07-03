import React from "react";
import { View, Text, TextInput, Switch, StyleSheet } from "react-native";
import useSettingsStore from "@/store/settingsStore";

export default function SettingsScreen() {
  const { theme, weight, devMode, setTheme, setWeight, setDevMode } =
    useSettingsStore();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Тема</Text>
      <View style={styles.row}>
        <Text
          style={[styles.themeOption, theme === "system" && styles.selected]}
          onPress={() => setTheme("system")}
        >
          Системная
        </Text>
        <Text
          style={[styles.themeOption, theme === "light" && styles.selected]}
          onPress={() => setTheme("light")}
        >
          Светлая
        </Text>
        <Text
          style={[styles.themeOption, theme === "dark" && styles.selected]}
          onPress={() => setTheme("dark")}
        >
          Тёмная
        </Text>
      </View>

      <Text style={styles.label}>Собственный вес (кг)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={weight.toString()}
        onChangeText={(text) => {
          const num = parseFloat(text.replace(",", "."));
          if (!isNaN(num)) setWeight(num);
        }}
        placeholder="Введите вес"
      />

      <View style={styles.switchRow}>
        <Text style={styles.label}>Режим разработчика</Text>
        <Switch value={devMode} onValueChange={setDevMode} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  label: { fontSize: 16, marginVertical: 12 },
  row: { flexDirection: "row", marginBottom: 16 },
  themeOption: {
    marginRight: 16,
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  selected: {
    backgroundColor: "#cce5ff",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    marginBottom: 16,
    width: 120,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
});
