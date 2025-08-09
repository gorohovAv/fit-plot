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
        <TouchableOpacity
          style={[
            styles.themeOption,
            {
              backgroundColor:
                theme === "system"
                  ? colors.selectorOptionSelected
                  : colors.selectorOption,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setTheme("system")}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color:
                  theme === "system"
                    ? colors.selectorOptionTextSelected
                    : colors.selectorOptionText,
              },
            ]}
          >
            {getTranslation(language, "system")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.themeOption,
            {
              backgroundColor:
                theme === "light"
                  ? colors.selectorOptionSelected
                  : colors.selectorOption,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setTheme("light")}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color:
                  theme === "light"
                    ? colors.selectorOptionTextSelected
                    : colors.selectorOptionText,
              },
            ]}
          >
            {getTranslation(language, "light")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.themeOption,
            {
              backgroundColor:
                theme === "dark"
                  ? colors.selectorOptionSelected
                  : colors.selectorOption,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setTheme("dark")}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color:
                  theme === "dark"
                    ? colors.selectorOptionTextSelected
                    : colors.selectorOptionText,
              },
            ]}
          >
            {getTranslation(language, "dark")}
          </Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          style={[
            styles.themeOption,
            {
              backgroundColor:
                language === "russian"
                  ? colors.selectorOptionSelected
                  : colors.selectorOption,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setLanguage("russian")}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color:
                  language === "russian"
                    ? colors.selectorOptionTextSelected
                    : colors.selectorOptionText,
              },
            ]}
          >
            Русский
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.themeOption,
            {
              backgroundColor:
                language === "english"
                  ? colors.selectorOptionSelected
                  : colors.selectorOption,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setLanguage("english")}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color:
                  language === "english"
                    ? colors.selectorOptionTextSelected
                    : colors.selectorOptionText,
              },
            ]}
          >
            English
          </Text>
        </TouchableOpacity>
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
        <Ionicons name="cloud-upload-outline" size={20} color={colors.text} />
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
  row: { flexDirection: "row", marginBottom: 16, gap: 8 },
  themeOption: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: "center",
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: "500",
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
