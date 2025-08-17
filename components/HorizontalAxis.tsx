import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as d3 from "d3";

type HorizontalAxisProps = {
  data: Array<{ x: string; y: number }>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  color: string;
};

const HorizontalAxis: React.FC<HorizontalAxisProps> = ({
  data,
  width,
  height,
  margin,
  color,
}) => {
  const innerWidth = width - margin.left - margin.right;
  const allDates = data.map((point) => new Date(point.x));

  const xScale = d3
    .scaleTime()
    .domain([d3.min(allDates) as Date, d3.max(allDates) as Date])
    .range([0, innerWidth])
    .nice();

  const tickCount = Math.floor(innerWidth / 80);
  const ticks = xScale.ticks(tickCount);

  return (
    <View style={[styles.container, { width, height: margin.bottom }]}>
      {ticks.map((tick, index) => {
        const x = xScale(tick) + margin.left;
        const dateStr = d3.timeFormat("%d.%m")(tick);

        return (
          <View
            key={index}
            style={[
              styles.tickContainer,
              {
                left: x,
                transform: [{ translateX: -15 }],
              },
            ]}
          >
            <Text style={[styles.tickText, { color }]}>{dateStr}</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  tickContainer: {
    position: "absolute",
    bottom: 0,
    width: 30,
    alignItems: "center",
  },
  tickText: {
    fontSize: 10,
    textAlign: "center",
    transform: [{ rotate: "-90deg" }],
  },
});

export default HorizontalAxis;
