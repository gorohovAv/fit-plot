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
  secondData?: DataPoint[]; // второй набор данных
  secondYAxisLabel?: string; // подпись второй оси
  secondYAxisColor?: string; // цвет второй оси
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
};

const Plot: React.FC<PlotProps> = ({
  data,
  additionalLines = [],
  highlightZones = [],
  secondData,
  secondYAxisLabel = "Y2",
  secondYAxisColor = "#d62728",
  width = 300,
  height = 200,
  margin = { top: 20, right: 40, bottom: 40, left: 40 },
}) => {
  if (!data || data.length === 0) {
    return <View style={styles.container} />;
  }

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Диапазон Y для первого набора
  const yDomain = [
    Math.min(0, d3.min(data, (d) => d.y) ?? 0),
    d3.max(data, (d) => d.y) ?? 0,
  ];

  // Диапазон Y для второго набора
  const y2Domain = secondData
    ? [
        Math.min(0, d3.min(secondData, (d) => d.y) ?? 0),
        d3.max(secondData, (d) => d.y) ?? 0,
      ]
    : undefined;

  // Масштабирование для оси X
  const xScale = d3
    .scaleTime()
    .domain([
      d3.min(data, (d) => new Date(d.x)) as Date,
      d3.max(data, (d) => new Date(d.x)) as Date,
    ])
    .range([0, innerWidth * 1.5])
    .nice();

  // Масштабирование для оси Y
  const yScale = d3
    .scaleLinear()
    .domain(yDomain as [number, number])
    .range([innerHeight, 0]);

  // Масштаб для второй оси Y
  const y2Scale = y2Domain
    ? d3
        .scaleLinear()
        .domain(y2Domain as [number, number])
        .range([innerHeight, 0])
    : undefined;

  // Генератор линий
  const lineGenerator = (data: DataPoint[]) =>
    d3
      .line<DataPoint>()
      .x((d) => xScale(new Date(d.x)))
      .y((d) => yScale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5))(data) || "";

  // Генератор основной линии, игнорирующий нулевые значения
  const mainLineGenerator = (data: DataPoint[]) =>
    d3
      .line<DataPoint>()
      .x((d) => xScale(new Date(d.x)))
      .y((d) => yScale(d.y))
      .defined((d) => d.y > 0) // Игнорируем точки, где y <= 0
      .curve(d3.curveCatmullRom.alpha(0.5))(data) || "";

  const mainLinePath = mainLineGenerator(data); // Используем новый генератор для основной линии
  const additionalLinesPaths = additionalLines.map(lineGenerator); // Для дополнительных линий используем старый генератор

  // Форматирование даты
  const formatDate = (date: Date) => d3.timeFormat("%d.%m.%Y")(date);

  // Вычисление индексов для меток X (максимальное расстояние)
  const minLabelGap = 50; // px
  const maxLabels = Math.floor((innerWidth * 1.5) / minLabelGap);
  const labelStep = Math.ceil(data.length / maxLabels);

  return (
    <View style={{ flexDirection: "row" }}>
      {/* Левая ось Y */}
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

      {/* Прокручиваемая часть */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          width: width * 15 + margin.left + margin.right + 100,
        }}
        contentOffset={{ x: 0, y: 0 }}
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
              {data.map((d, i) =>
                i % labelStep === 0 ? (
                  <G
                    key={`x-${i}`}
                    transform={`translate(${xScale(new Date(d.x))}, 0)`}
                  >
                    <Line y1={0} y2={5} stroke="#888" strokeWidth={1} />
                    <SvgText
                      x={0}
                      y={35} // увеличили отступ между датой и осью
                      textAnchor="middle"
                      fontSize={10}
                      fill="#888"
                      transform={`rotate(-90, 0, 35)`}
                    >
                      {formatDate(new Date(d.x))}
                    </SvgText>
                  </G>
                ) : null
              )}
            </G>

            {/* Основная линия */}
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

            {/* Вторая линия и ось Y справа */}
            {secondData && y2Scale && (
              <>
                {/* Вторая линия */}
                <G transform={`translate(${margin.left}, ${margin.top})`}>
                  <Path
                    d={
                      d3
                        .line<DataPoint>()
                        .x((d) => xScale(new Date(d.x)))
                        .y((d) => y2Scale(d.y))
                        .curve(d3.curveCatmullRom.alpha(0.5))(secondData) || ""
                    }
                    fill="none"
                    stroke={secondYAxisColor}
                    strokeWidth={2}
                  />
                  {secondData.map((d, i) => (
                    <Circle
                      key={`point2-${i}`}
                      cx={xScale(new Date(d.x))}
                      cy={y2Scale(d.y)}
                      r={4}
                      fill={secondYAxisColor}
                    />
                  ))}
                </G>
                {/* Вторая ось Y */}
                <G
                  transform={`translate(${innerWidth * 15 + margin.left + 5}, ${
                    margin.top
                  })`}
                >
                  <Line
                    x1={0}
                    y1={0}
                    x2={0}
                    y2={innerHeight}
                    stroke={secondYAxisColor}
                    strokeWidth={1}
                  />
                  <Polygon points={`0,-5 -5,0 5,0`} fill={secondYAxisColor} />
                  {y2Scale.ticks(5).map((tick, i) => (
                    <G
                      key={`y2-${i}`}
                      transform={`translate(0, ${y2Scale(tick)})`}
                    >
                      <Line
                        x1={0}
                        x2={5}
                        stroke={secondYAxisColor}
                        strokeWidth={1}
                      />
                      <SvgText
                        x={15}
                        y={5}
                        textAnchor="start"
                        fontSize={10}
                        fill={secondYAxisColor}
                      >
                        {tick}
                      </SvgText>
                    </G>
                  ))}
                  <SvgText
                    x={15}
                    y={-10}
                    textAnchor="start"
                    fontSize={12}
                    fill={secondYAxisColor}
                  >
                    {secondYAxisLabel}
                  </SvgText>
                </G>
              </>
            )}

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
