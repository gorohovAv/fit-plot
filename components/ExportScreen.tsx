import useSettingsStore from "@/store/settingsStore";
import {
  exportDataToFile,
  exportToPDF,
  getExportData,
  hasEnoughDataForPDF,
} from "@/utils/exportUtils";
import { getTranslation } from "@/utils/localization";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";

interface ExportScreenProps {
  onBack: () => void;
}

export function ExportScreen({ onBack }: ExportScreenProps) {
  const [isExporting, setIsExporting] = useState(false);

  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const colorScheme =
    theme === "dark"
      ? Colors.dark
      : theme === "light"
        ? Colors.light
        : Colors.light;

  const data = getExportData();
  const canExportPDF = hasEnoughDataForPDF(data);

  const handleExport = async (format: "excel" | "text") => {
    setIsExporting(true);

    try {
      const data = getExportData();
      await exportDataToFile(data, format);

      Alert.alert(
        getTranslation(language, "success"),
        getTranslation(language, "dataExportSuccess"),
        [{ text: "OK", onPress: onBack }]
      );
    } catch (error) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "dataExportError")
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canExportPDF) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "notEnoughDataForPDF")
      );
      return;
    }

    setIsExporting(true);

    try {
      const data = getExportData();
      await exportToPDF(data);

      Alert.alert(
        getTranslation(language, "success"),
        getTranslation(language, "dataExportSuccess"),
        [{ text: "OK", onPress: onBack }]
      );
    } catch (error) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "dataExportError")
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colorScheme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.text }]}>
          {getTranslation(language, "exportData")}
        </Text>
      </View>

      <Text style={[styles.description, { color: colorScheme.text }]}>
        {getTranslation(language, "exportDescription")}
      </Text>

      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            borderColor: colorScheme.border,
            backgroundColor: colorScheme.card,
          },
        ]}
        onPress={() => handleExport("excel")}
        disabled={isExporting}
      >
        <Ionicons name="document-outline" size={24} color={colorScheme.text} />
        <View style={styles.buttonContent}>
          <Text style={[styles.buttonTitle, { color: colorScheme.text }]}>
            {getTranslation(language, "exportToExcel")}
          </Text>
          <Text style={[styles.buttonDescription, { color: colorScheme.text + "80" }]}>
            {getTranslation(language, "excelDescription")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colorScheme.text} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            borderColor: colorScheme.border,
            backgroundColor: colorScheme.card,
          },
        ]}
        onPress={() => handleExport("text")}
        disabled={isExporting}
      >
        <Ionicons name="document-text-outline" size={24} color={colorScheme.text} />
        <View style={styles.buttonContent}>
          <Text style={[styles.buttonTitle, { color: colorScheme.text }]}>
            {getTranslation(language, "exportToText")}
          </Text>
          <Text style={[styles.buttonDescription, { color: colorScheme.text + "80" }]}>
            {getTranslation(language, "textDescription")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colorScheme.text} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            borderColor: colorScheme.border,
            backgroundColor: colorScheme.card,
            opacity: canExportPDF ? 1 : 0.5,
          },
        ]}
        onPress={handleExportPDF}
        disabled={isExporting || !canExportPDF}
      >
        <Ionicons name="document-outline" size={24} color={colorScheme.text} />
        <View style={styles.buttonContent}>
          <Text style={[styles.buttonTitle, { color: colorScheme.text }]}>
            {getTranslation(language, "exportToPDF")}
          </Text>
          <Text style={[styles.buttonDescription, { color: colorScheme.text + "80" }]}>
            {getTranslation(language, "pdfDescription")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colorScheme.text} />
      </TouchableOpacity>

      {isExporting && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colorScheme.text }]}>
            {getTranslation(language, "exporting")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  buttonContent: {
    flex: 1,
    marginLeft: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  loadingText: {
    fontSize: 16,
  },
});
