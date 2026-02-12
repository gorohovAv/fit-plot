import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface BarData {
  date: string;
  calories: number;
  weight: number;
}

interface VerticalBarChartProps {
  data: BarData[];
  caloriesColor: string;
  weightColor: string;
  textColor: string;
  backgroundColor: string;
  maxCalories?: number;
  maxWeight?: number;
}

export default function VerticalBarChart({
  data,
  caloriesColor,
  weightColor,
  textColor,
  backgroundColor,
  maxCalories,
  maxWeight,
}: VerticalBarChartProps) {
  if (data.length === 0) {
    return null;
  }

  // Calculate max values for scaling
  const calculatedMaxCalories =
    maxCalories || Math.max(...data.map((d) => d.calories));
  const calculatedMaxWeight =
    maxWeight || Math.max(...data.map((d) => d.weight));

  // Bar dimensions
  const barWidth = 60;
  const maxBarHeight = 120;
  const spacing = 20;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((item, index) => {
          const caloriesHeight =
            (item.calories / calculatedMaxCalories) * maxBarHeight;
          const weightHeight =
            (item.weight / calculatedMaxWeight) * maxBarHeight;

          return (
            <View
              key={index}
              style={[styles.barGroup, { width: barWidth + spacing }]}
            >
              <Text style={[styles.dateLabel, { color: textColor }]}>
                {formatDate(item.date)}
              </Text>

              <View style={styles.barsContainer}>
                <View style={styles.caloriesSection}>
                  <Text style={[styles.valueLabel, { color: textColor }]}>
                    {item.calories}
                  </Text>
                  <View
                    style={[
                      styles.caloriesBar,
                      {
                        height: caloriesHeight,
                        backgroundColor: caloriesColor,
                        width: barWidth / 2 - 2,
                      },
                    ]}
                  />
                </View>

                <View
                  style={[styles.centerLine, { backgroundColor: textColor }]}
                />

                <View style={styles.weightSection}>
                  <View
                    style={[
                      styles.weightBar,
                      {
                        height: weightHeight,
                        backgroundColor: weightColor,
                        width: barWidth / 2 - 2,
                      },
                    ]}
                  />
                  <Text style={[styles.valueLabel, { color: textColor }]}>
                    {item.weight}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  barGroup: {
    alignItems: "center",
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  barsContainer: {
    alignItems: "center",
    height: 300,
  },
  caloriesSection: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 140,
    marginBottom: 2,
  },
  caloriesBar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginTop: 4,
  },
  centerLine: {
    width: 30,
    height: 2,
    opacity: 0.3,
  },
  weightSection: {
    alignItems: "center",
    justifyContent: "flex-start",
    height: 140,
    marginTop: 2,
  },
  weightBar: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 4,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    minHeight: 16,
  },
});
