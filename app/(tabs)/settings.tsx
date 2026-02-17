import { Colors } from "@/constants/Colors";
import useSettingsStore from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

import { ExportScreen } from "@/components/ExportScreen";
import { ImportScreen } from "@/components/ImportScreen";
import { getTranslation } from "@/utils/localization";
import { importOldVersionData } from "@/utils/oldVersionImport";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";

export default function SettingsScreen() {
  const {
    theme,
    weight,
    devMode,
    language,
    maxMicrohistorySize,
    visibleMetrics,
    setTheme,
    setWeight,
    setDevMode,
    setLanguage,
    setMaxMicrohistorySize,
    setVisibleMetrics,
  } = useSettingsStore();
  const systemTheme = useColorScheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const colors = Colors[currentTheme || "light"];
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAnalyticsSettings, setShowAnalyticsSettings] = useState(false);

  if (showImport) {
    return <ImportScreen onBack={() => setShowImport(false)} />;
  }

  if (showExport) {
    return <ExportScreen onBack={() => setShowExport(false)} />;
  }

  const handleMigration = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();

      console.log("Importing text:", text.substring(0, 200) + "..."); // Log first 200 chars
      await importOldVersionData(text);
      console.log("Import completed successfully");
      Alert.alert(
        getTranslation(language, "success"),
        getTranslation(language, "dataImportSuccess")
      );
    } catch (error: any) {
      console.error("Import error:", error);
      Alert.alert(
        getTranslation(language, "error"),
        `${getTranslation(language, "dataImportError")}: ${error.message || error}`
      );
    }
  };

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

      <Text style={[styles.label, { color: colors.text }]}>
        {getTranslation(language, "maxMicrohistorySize")}
      </Text>
      <Text style={[styles.description, { color: colors.icon }]}>
        {getTranslation(language, "microhistoryDescription")}
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
        value={maxMicrohistorySize.toString()}
        onChangeText={(text) => {
          const num = parseInt(text);
          if (!isNaN(num) && num > 0) setMaxMicrohistorySize(num);
        }}
        placeholder={getTranslation(language, "maxMicrohistorySize")}
        placeholderTextColor={colors.icon}
      />

      <TouchableOpacity
        style={[
          styles.accordionHeader,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        onPress={() => setShowAnalyticsSettings(!showAnalyticsSettings)}
      >
        <Text style={[styles.accordionHeaderText, { color: colors.text }]}>
          {getTranslation(language, "analyticsSettings")}
        </Text>
        <Ionicons
          name={showAnalyticsSettings ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.text}
        />
      </TouchableOpacity>

      {showAnalyticsSettings && (
        <View
          style={[
            styles.accordionContent,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}
        >
          <Text style={[styles.accordionLabel, { color: colors.text }]}>
            {getTranslation(language, "visibleMetrics")}
          </Text>

          <View style={styles.checkboxRow}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              {getTranslation(language, "generalTonnage")}
            </Text>
            <Switch
              value={visibleMetrics.tonnage}
              onValueChange={(value) =>
                setVisibleMetrics({ ...visibleMetrics, tonnage: value })
              }
            />
          </View>

          <View style={styles.checkboxRow}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              {getTranslation(language, "maxWeight")}
            </Text>
            <Switch
              value={visibleMetrics.maxWeight}
              onValueChange={(value) =>
                setVisibleMetrics({ ...visibleMetrics, maxWeight: value })
              }
            />
          </View>

          <View style={styles.checkboxRow}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              {getTranslation(language, "maxReps")}
            </Text>
            <Switch
              value={visibleMetrics.maxReps}
              onValueChange={(value) =>
                setVisibleMetrics({ ...visibleMetrics, maxReps: value })
              }
            />
          </View>

          <View style={styles.checkboxRow}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              {getTranslation(language, "avgWeight")}
            </Text>
            <Switch
              value={visibleMetrics.avgWeight}
              onValueChange={(value) =>
                setVisibleMetrics({ ...visibleMetrics, avgWeight: value })
              }
            />
          </View>

          <View style={styles.checkboxRow}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              {getTranslation(language, "minWeight")}
            </Text>
            <Switch
              value={visibleMetrics.minWeight}
              onValueChange={(value) =>
                setVisibleMetrics({ ...visibleMetrics, minWeight: value })
              }
            />
          </View>

          <View style={styles.checkboxRow}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              {getTranslation(language, "workoutTime")}
            </Text>
            <Switch
              value={visibleMetrics.workoutTime}
              onValueChange={(value) =>
                setVisibleMetrics({ ...visibleMetrics, workoutTime: value })
              }
            />
          </View>
        </View>
      )}

      <Text style={[styles.label, { color: colors.text }]}>{getTranslation(language, "language")}</Text>
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
          styles.migrationButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        onPress={handleMigration}
      >
        <Ionicons name="sync-outline" size={20} color={colors.text} />
        <Text style={[styles.migrationButtonText, { color: colors.text }]}>
          {getTranslation(language, "migrateFromOldVersion")}
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
  description: { fontSize: 14, marginVertical: 4, opacity: 0.7 },
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
  migrationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  migrationButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  accordionHeaderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  accordionContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderRadius: 8,
    padding: 16,
    marginTop: -8,
    marginBottom: 16,
  },
  accordionLabel: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 15,
  },
});
