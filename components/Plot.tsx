import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Svg, {
  Line,
  Path,
  Polygon,
  G,
  Text as SvgText,
  Circle,
} from "react-native-svg";
import * as d3 from "d3";

type DataPoint = {
  x: string;
  y: number;
};

type PlotProps = {
  data: DataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

const Plot: React.FC<PlotProps> = ({
  data,
  width = 300,
  height = 200,
  margin = { top: 20, right: 30, bottom: 40, left: 40 },
}) => {
  if (!data || data.length === 0) {
    return <View style={styles.container} />;
  }

  // Размеры области графика (без отступов)
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Масштабирование для оси X (даты)
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => new Date(d.x)) as [Date, Date])
    .range([0, innerWidth]);

  // Масштабирование для оси Y (числа)
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y) || 0] as [number, number])
    .range([innerHeight, 0]);

  // Генератор линии для графика
  const line = d3
    .line<DataPoint>()
    .x((d) => xScale(new Date(d.x)))
    .y((d) => yScale(d.y))
    .curve(d3.curveCatmullRom.alpha(0.5)); // Плавная кривая без резких изломов

  const linePath = line(data) || "";

  // Форматирование даты для подписей
  const formatDate = (date: Date) => {
    return d3.timeFormat("%d.%m")(date);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ width: width + 100 }} // Дополнительное пространство для скролла
    >
      <View style={styles.container}>
        <Svg width={width} height={height}>
          {/* Ось X */}
          <G transform={`translate(${margin.left}, ${height - margin.bottom})`}>
            <Line
              x1={0}
              y1={0}
              x2={innerWidth}
              y2={0}
              stroke="#888"
              strokeWidth={1}
            />
            {/* Стрелка оси X */}
            <Polygon
              points={`${innerWidth + 5},0 ${innerWidth},-5 ${innerWidth},5`}
              fill="#888"
            />
            {/* Подписи оси X */}
            {data.map((d, i) => (
              <G
                key={`x-${i}`}
                transform={`translate(${xScale(new Date(d.x))}, 0)`}
              >
                <Line y1={0} y2={5} stroke="#888" strokeWidth={1} />
                <SvgText
                  x={0}
                  y={20}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#888"
                >
                  {formatDate(new Date(d.x))}
                </SvgText>
              </G>
            ))}
          </G>

          {/* Ось Y */}
          <G transform={`translate(${margin.left}, ${margin.top})`}>
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke="#888"
              strokeWidth={1}
            />
            {/* Стрелка оси Y */}
            <Polygon points={`0,-5 -5,0 5,0`} fill="#888" />
            {/* Подписи оси Y */}
            {yScale.ticks(5).map((tick, i) => (
              <G key={`y-${i}`} transform={`translate(0, ${yScale(tick)})`}>
                <Line x1={-5} x2={0} stroke="#888" strokeWidth={1} />
                <SvgText
                  x={-10}
                  y={5}
                  textAnchor="end"
                  fontSize={10}
                  fill="#888"
                >
                  {tick}
                </SvgText>
              </G>
            ))}
          </G>

          {/* График */}
          <G transform={`translate(${margin.left}, ${margin.top})`}>
            <Path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2} />
            {/* Точки данных */}
            {data.map((d, i) => (
              <Circle
                key={`point-${i}`}
                cx={xScale(new Date(d.x))}
                cy={yScale(d.y)}
                r={4}
                fill="#3b82f6"
              />
            ))}
          </G>
        </Svg>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default Plot;
