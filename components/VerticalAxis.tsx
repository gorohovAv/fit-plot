import * as d3 from "d3";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type VerticalAxisProps = {
  data: { x: string; y: number }[];
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  color: string;
  position: "left" | "right";
  axisLabel?: string;
  backgroundColor?: string;
  yScale?: d3.ScaleLinear<number, number>;
};

const VerticalAxis: React.FC<VerticalAxisProps> = ({
  data,
  height,
  margin,
  color,
  position,
  axisLabel,
  backgroundColor,
  yScale,
}) => {
  const innerHeight = height - margin.top - margin.bottom;

  let scale: d3.ScaleLinear<number, number>;

  if (yScale) {
    scale = yScale;
  } else {
    const yMin = Math.min(0, d3.min(data, (d) => d.y) ?? 0);
    const yMax = d3.max(data, (d) => d.y) ?? 0;
    const yPadding = (yMax - yMin) * 0.1;
    const yDomain = [yMin - yPadding, yMax + yPadding];

    scale = d3
      .scaleLinear()
      .domain(yDomain as [number, number])
      .range([innerHeight, 0]);
  }

  const [domainMin, domainMax] = scale.domain();
  const dataMax = d3.max(data, (d) => d.y) ?? 0;
  const dataMin = 0;

  console.log("VerticalAxis debug:", {
    domainMin,
    domainMax,
    dataMin,
    dataMax,
  });

  const tickCount = 6;
  const ticks: number[] = [];

  for (let i = 0; i <= tickCount; i++) {
    const tickValue = 0 + (domainMax - 0) * (i / tickCount);
    ticks.push(tickValue);
  }

  if (dataMax > ticks[ticks.length - 1]) {
    ticks[ticks.length - 1] = Math.max(dataMax, ticks[ticks.length - 1]);
  }

  const containerStyle =
    position === "left"
      ? { left: 0, width: margin.left }
      : { right: 0, width: margin.right };

  return (
    <View
      style={[styles.container, containerStyle, { height, backgroundColor }]}
    >
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
          const y = scale(tick) + margin.top;

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

              <View
                style={[
                  styles.tickMarkVertical,
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
    zIndex: 10,
  },
  axisLabel: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    marginRight: 10,
  },
  ticksContainer: {
    flex: 1,
    position: "relative",
  },
  axisLine: {
    position: "absolute",
    width: 0,
    height: 200,
  },
  tickContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
  },
  tickMark: {
    position: "absolute",
    width: 4,
    height: 1,
  },
  tickText: {
    fontSize: 10,
    textAlign: "center",
    position: "absolute",
  },
  tickMarkVertical: {
    position: "absolute",
    width: 1,
    height: 40,
  },
});

export default VerticalAxis;
