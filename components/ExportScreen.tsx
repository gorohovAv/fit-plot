import { useThemeColor } from "@/hooks/useThemeColor";
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

interface ExportScreenProps {
  onBack: () => void;
}

export function ExportScreen({ onBack }: ExportScreenProps) {
  const [isExporting, setIsExporting] = useState(false);

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const cardColor = useThemeColor({}, "card");

  const language = useSettingsStore((state) => state.language);
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
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>
          {getTranslation(language, "exportData")}
        </Text>
      </View>

      <Text style={[styles.description, { color: textColor }]}>
        {getTranslation(language, "exportDescription")}
      </Text>

      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            borderColor,
            backgroundColor: cardColor,
          },
        ]}
        onPress={() => handleExport("excel")}
        disabled={isExporting}
      >
        <Ionicons name="document-outline" size={24} color={textColor} />
        <View style={styles.buttonContent}>
          <Text style={[styles.buttonTitle, { color: textColor }]}>
            {getTranslation(language, "exportToExcel")}
          </Text>
          <Text style={[styles.buttonDescription, { color: textColor + "80" }]}>
            {getTranslation(language, "excelDescription")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={textColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            borderColor,
            backgroundColor: cardColor,
          },
        ]}
        onPress={() => handleExport("text")}
        disabled={isExporting}
      >
        <Ionicons name="document-text-outline" size={24} color={textColor} />
        <View style={styles.buttonContent}>
          <Text style={[styles.buttonTitle, { color: textColor }]}>
            {getTranslation(language, "exportToText")}
          </Text>
          <Text style={[styles.buttonDescription, { color: textColor + "80" }]}>
            {getTranslation(language, "textDescription")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={textColor} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.exportButton,
          {
            borderColor,
            backgroundColor: cardColor,
            opacity: canExportPDF ? 1 : 0.5,
          },
        ]}
        onPress={handleExportPDF}
        disabled={isExporting || !canExportPDF}
      >
        <Ionicons name="document-outline" size={24} color={textColor} />
        <View style={styles.buttonContent}>
          <Text style={[styles.buttonTitle, { color: textColor }]}>
            {getTranslation(language, "exportToPDF")}
          </Text>
          <Text style={[styles.buttonDescription, { color: textColor + "80" }]}>
            {getTranslation(language, "pdfDescription")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={textColor} />
      </TouchableOpacity>

      {isExporting && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>
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
