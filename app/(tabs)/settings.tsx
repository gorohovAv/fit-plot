import React from "react";
import { View, Text, TextInput, Switch, StyleSheet } from "react-native";
import useSettingsStore from "@/store/settingsStore";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";

export default function SettingsScreen() {
  const { theme, weight, devMode, setTheme, setWeight, setDevMode } =
    useSettingsStore();
  const systemTheme = useColorScheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const colors = Colors[currentTheme || "light"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>Тема</Text>
      <View style={styles.row}>
        <Text
          style={[
            styles.themeOption,
            theme === "system" && styles.selected,
            theme === "system" && {
              backgroundColor: colors.tabIconSelected,
              color: colors.text,
            },
          ]}
          onPress={() => setTheme("system")}
        >
          Системная
        </Text>
        <Text
          style={[
            styles.themeOption,
            theme === "light" && styles.selected,
            theme === "light" && {
              backgroundColor: colors.tabIconSelected,
              color: colors.text,
            },
          ]}
          onPress={() => setTheme("light")}
        >
          Светлая
        </Text>
        <Text
          style={[
            styles.themeOption,
            theme === "dark" && styles.selected,
            theme === "dark" && {
              backgroundColor: colors.tabIconSelected,
              color: colors.text,
            },
          ]}
          onPress={() => setTheme("dark")}
        >
          Тёмная
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>
        Собственный вес (кг)
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.card,
          },
        ]}
        keyboardType="numeric"
        value={weight.toString()}
        onChangeText={(text) => {
          const num = parseFloat(text.replace(",", "."));
          if (!isNaN(num)) setWeight(num);
        }}
        placeholder="Введите вес"
        placeholderTextColor={colors.icon}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          Режим разработчика
        </Text>
        <Switch value={devMode} onValueChange={setDevMode} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  label: { fontSize: 16, marginVertical: 12 },
  row: { flexDirection: "row", marginBottom: 16 },
  themeOption: {
    marginRight: 16,
    fontSize: 16,
    padding: 8,
    borderRadius: 8,
  },
  selected: {
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
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
