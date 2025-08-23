import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as d3 from "d3";

type HorizontalAxisProps = {
  data: Array<{ x: string; y: number }>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  color: string;
  xScale?: d3.ScaleTime<number, number>;
};

const HorizontalAxis: React.FC<HorizontalAxisProps> = ({
  data,
  width,
  height,
  margin,
  color,
  xScale: providedXScale,
}) => {
  const innerWidth = width - margin.left - margin.right;
  const allDates = data.map((point) => new Date(point.x));

  const xScale =
    providedXScale ||
    d3
      .scaleTime()
      .domain([d3.min(allDates) as Date, d3.max(allDates) as Date])
      .range([0, innerWidth])
      .nice();

  // Увеличиваем количество делений для лучшего отображения
  const tickCount = Math.max(3, Math.floor(innerWidth / 100));
  const ticks = xScale.ticks(tickCount);

  return (
    <View style={[styles.container, { width, height: margin.bottom }]}>
      <View
        style={[
          styles.axisLine,
          {
            backgroundColor: color,
            width: innerWidth,
            left: margin.left,
            top: 0,
          },
        ]}
      />

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
                transform: [{ translateX: -20 }], // Увеличиваем отступ для лучшего позиционирования
              },
            ]}
          >
            <View style={[styles.tickMark, { backgroundColor: color }]} />
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
    marginTop: 10,
    overflow: "visible", // Изменяем на visible чтобы даты не обрезались
  },
  axisLine: {
    position: "absolute",
    height: 1,
  },
  tickContainer: {
    position: "absolute",
    top: 0,
    width: 40, // Увеличиваем ширину контейнера
    alignItems: "center",
  },
  tickMark: {
    width: 1,
    height: 8,
    marginTop: -4,
  },
  tickText: {
    fontSize: 10, // Увеличиваем размер шрифта
    textAlign: "center",
    transform: [{ rotate: "-90deg" }],
    marginTop: 15, // Увеличиваем отступ сверху
    width: 40, // Фиксируем ширину текста
  },
});

export default HorizontalAxis;
