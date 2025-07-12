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
  additionalLines?: DataPoint[][];
  highlightZones?: { start: string; end: string; color: string }[];
  fixedYRange?: number;
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

const Plot: React.FC<PlotProps> = ({
  data,
  additionalLines = [],
  highlightZones = [],
  fixedYRange,
  width = 300,
  height = 200,
  margin = { top: 20, right: 30, bottom: 40, left: 40 },
}) => {
  if (!data || data.length === 0) {
    return <View style={styles.container} />;
  }

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Фиксированный диапазон Y если указан
  const yDomain = fixedYRange
    ? [0, fixedYRange]
    : [0, d3.max(data, (d) => d.y) || 0];

  // Масштабирование для оси X с увеличенным доменом
  const xScale = d3
    .scaleTime()
    .domain([
      d3.min(data, (d) => new Date(d.x)) as Date,
      d3.max(data, (d) => new Date(d.x)) as Date,
    ])
    .range([0, innerWidth * 15]) // Увеличиваем диапазон в 15 раз, чтобы даты были видны
    .nice();

  // Масштабирование для оси Y
  const yScale = d3
    .scaleLinear()
    .domain(yDomain as [number, number])
    .range([innerHeight, 0]);

  // Генератор линий
  const lineGenerator = (data: DataPoint[]) =>
    d3
      .line<DataPoint>()
      .x((d) => xScale(new Date(d.x)))
      .y((d) => yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5))(data) || "";

  const mainLinePath = lineGenerator(data);
  const additionalLinesPaths = additionalLines.map(lineGenerator);

  // Форматирование даты
  const formatDate = (date: Date) => d3.timeFormat("%d.%m.%Y")(date);

  return (
    <View style={{ flexDirection: "row" }}>
      {/* Фиксированная ось Y */}
      <View style={{ width: margin.left }}>
        <Svg width={margin.left} height={height}>
          <G transform={`translate(${margin.left - 5}, ${margin.top})`}>
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke="#888"
              strokeWidth={1}
            />
            <Polygon points={`0,-5 -5,0 5,0`} fill="#888" />
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
        </Svg>
      </View>

      {/* Прокручиваемая часть с графиком */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          width: width * 15 + margin.left + margin.right + 100, // +100 для запаса
        }}
        contentOffset={{ x: 0, y: 0 }} // Начинаем с левого края
      >
        <View style={styles.container}>
          <Svg width={width * 15} height={height}>
            {/* Выделенные зоны */}
            {highlightZones.map((zone, i) => {
              const startX = xScale(new Date(zone.start));
              const endX = xScale(new Date(zone.end));
              return (
                <G
                  key={`zone-${i}`}
                  transform={`translate(${margin.left}, ${margin.top})`}
                >
                  <Path
                    d={`M${startX},0 L${endX},0 L${endX},${innerHeight} L${startX},${innerHeight} Z`}
                    fill={zone.color}
                    fillOpacity={0.2}
                  />
                </G>
              );
            })}

            {/* Ось X */}
            <G
              transform={`translate(${margin.left}, ${height - margin.bottom})`}
            >
              <Line
                x1={0}
                y1={0}
                x2={innerWidth * 15}
                y2={0}
                stroke="#888"
                strokeWidth={1}
              />
              <Polygon
                points={`${innerWidth * 15 + 5},0 ${innerWidth * 15},-5 ${
                  innerWidth * 15
                },5`}
                fill="#888"
              />
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

            {/* Основная линия графика */}
            <G transform={`translate(${margin.left}, ${margin.top})`}>
              <Path
                d={mainLinePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={2}
              />
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

            {/* Дополнительные линии */}
            {additionalLinesPaths.map((path, i) => (
              <G
                key={`line-${i}`}
                transform={`translate(${margin.left}, ${margin.top})`}
              >
                <Path
                  d={path}
                  fill="none"
                  stroke={["#ff7f0e", "#2ca02c", "#d62728"][i % 3]}
                  strokeWidth={2}
                />
              </G>
            ))}
          </Svg>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default Plot;
