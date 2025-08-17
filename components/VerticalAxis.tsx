import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as d3 from "d3";

type VerticalAxisProps = {
  data: Array<{ x: string; y: number }>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  color: string;
  position: "left" | "right";
  axisLabel?: string;
};

const VerticalAxis: React.FC<VerticalAxisProps> = ({
  data,
  height,
  margin,
  color,
  position,
  axisLabel,
}) => {
  const innerHeight = height - margin.top - margin.bottom;
  const yMin = Math.min(0, d3.min(data, (d) => d.y) ?? 0);
  const yMax = d3.max(data, (d) => d.y) ?? 0;
  const yPadding = (yMax - yMin) * 0.1;
  const yDomain = [yMin - yPadding, yMax + yPadding];

  const yScale = d3
    .scaleLinear()
    .domain(yDomain as [number, number])
    .range([innerHeight, 0]);

  const tickCount = 5;
  const ticks = yScale.ticks(tickCount);

  const containerStyle =
    position === "left"
      ? { left: 0, width: margin.left }
      : { right: 0, width: margin.right };

  return (
    <View style={[styles.container, containerStyle, { height }]}>
      {axisLabel && (
        <Text style={[styles.axisLabel, { color }]}>{axisLabel}</Text>
      )}
      <View style={styles.ticksContainer}>
        <View
          style={[
            styles.axisLine,
            {
              backgroundColor: color,
              height: innerHeight,
              top: margin.top,
              [position === "left" ? "right" : "left"]: 0,
            },
          ]}
        />
        {ticks.map((tick, index) => {
          const y = yScale(tick) + margin.top;

          return (
            <View
              key={index}
              style={[
                styles.tickContainer,
                {
                  top: y,
                  transform: [{ translateY: -10 }],
                },
              ]}
            >
              <View
                style={[
                  styles.tickMark,
                  {
                    backgroundColor: color,
                    [position === "left" ? "right" : "left"]: 0,
                  },
                ]}
              />
              <Text
                style={[
                  styles.tickText,
                  {
                    color,
                    [position === "left" ? "right" : "left"]: 8,
                  },
                ]}
              >
                {tick.toFixed(1)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
  axisLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  ticksContainer: {
    flex: 1,
    position: "relative",
  },
  axisLine: {
    position: "absolute",
    width: 1,
  },
  tickContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
  },
  tickMark: {
    position: "absolute",
    width: 8,
    height: 1,
  },
  tickText: {
    fontSize: 10,
    textAlign: "center",
    position: "absolute",
  },
});

export default VerticalAxis;
