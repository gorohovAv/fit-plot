import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useSettingsStore from "@/store/settingsStore";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";
import { ImportScreen } from "@/components/ImportScreen";
import { ExportScreen } from "@/components/ExportScreen";
import { getTranslation } from "@/utils/localization";

export default function SettingsScreen() {
  const {
    theme,
    weight,
    devMode,
    language,
    setTheme,
    setWeight,
    setDevMode,
    setLanguage,
  } = useSettingsStore();
  const systemTheme = useColorScheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const colors = Colors[currentTheme || "light"];
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  if (showImport) {
    return <ImportScreen onBack={() => setShowImport(false)} />;
  }

  if (showExport) {
    return <ExportScreen onBack={() => setShowExport(false)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.label, { color: colors.text }]}>
        {getTranslation(language, "theme")}
      </Text>
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
          {getTranslation(language, "system")}
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
          {getTranslation(language, "light")}
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
          {getTranslation(language, "dark")}
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>
        {getTranslation(language, "weight")}
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
        placeholder={getTranslation(language, "enterWeight")}
        placeholderTextColor={colors.icon}
      />

      <Text style={[styles.label, { color: colors.text }]}>Язык</Text>
      <View style={styles.row}>
        <Text
          style={[
            styles.themeOption,
            language === "russian" && styles.selected,
            language === "russian" && {
              backgroundColor: colors.tabIconSelected,
              color: colors.text,
            },
          ]}
          onPress={() => setLanguage("russian")}
        >
          Русский
        </Text>
        <Text
          style={[
            styles.themeOption,
            language === "english" && styles.selected,
            language === "english" && {
              backgroundColor: colors.tabIconSelected,
              color: colors.text,
            },
          ]}
          onPress={() => setLanguage("english")}
        >
          English
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.importButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        onPress={() => setShowImport(true)}
      >
        <Ionicons name="download-outline" size={20} color={colors.text} />
        <Text style={[styles.importButtonText, { color: colors.text }]}>
          {getTranslation(language, "importData")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        onPress={() => setShowExport(true)}
      >
        <Ionicons name="upload-outline" size={20} color={colors.text} />
        <Text style={[styles.exportButtonText, { color: colors.text }]}>
          {getTranslation(language, "exportData")}
        </Text>
      </TouchableOpacity>
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
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  importButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  exportButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
});
