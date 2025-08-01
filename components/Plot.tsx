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
import { useMemo } from "react";
import useSettingsStore from "@/store/settingsStore";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";

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
  secondYAxisColor,
  width = 300,
  height = 200,
  margin = { top: 20, right: 40, bottom: 40, left: 40 },
}) => {
  const settingsTheme = useSettingsStore((s) => s.theme);
  const systemTheme = useColorScheme();
  const theme = settingsTheme === "system" ? systemTheme : settingsTheme;
  const colors = Colors[theme || "light"];

  // Используем цвет из палитры темы, если не передан
  const secondAxisColor = secondYAxisColor || colors.chartLine[1];

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

  // Генератор второй линии
  const secondLineGenerator = (data: DataPoint[]) =>
    d3
      .line<DataPoint>()
      .x((d) => xScale(new Date(d.x)))
      .y((d) => y2Scale(d.y))
      .curve(d3.curveCatmullRom.alpha(0.5))(data) || "";

  // Форматирование даты
  const formatDate = (date: Date) => d3.timeFormat("%d.%m.%Y")(date);

  // Вычисление индексов для меток X (максимальное расстояние)
  const minLabelGap = 50; // px
  const maxLabels = Math.floor((innerWidth * 1.5) / minLabelGap);
  const labelStep = Math.ceil(data.length / maxLabels);

  // Генерация тиков для оси Y
  const yTicks = yScale.ticks(5);
  // Генерация тиков для оси X
  const xTicks = xScale.ticks(maxLabels);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width} height={height}>
        <G>
          {/* Сетка */}
          {yTicks.map((tick) => (
            <Line
              key={tick}
              x1={0}
              y1={yScale(tick)}
              x2={innerWidth}
              y2={yScale(tick)}
              stroke={colors.chartGrid}
              strokeWidth={0.5}
            />
          ))}

          {/* Ось Y */}
          <Line
            x1={0}
            y1={0}
            x2={0}
            y2={innerHeight}
            stroke={colors.text}
            strokeWidth={1}
          />

          {/* Подписи оси Y */}
          {yTicks.map((tick) => (
            <SvgText
              key={tick}
              x={-5}
              y={yScale(tick) + 4}
              fontSize={10}
              fill={colors.text}
              textAnchor="end"
            >
              {tick}
            </SvgText>
          ))}

          {/* Основная линия */}
          <Path
            d={mainLineGenerator(data) || ""}
            fill="none"
            stroke={colors.chartLine[0]}
            strokeWidth={2}
          />

          {/* Вторая линия */}
          {secondData && y2Scale && (
            <Path
              d={secondLineGenerator(secondData) || ""}
              fill="none"
              stroke={secondAxisColor}
              strokeWidth={2}
            />
          )}

          {/* Точки данных */}
          {data.map((point, index) => (
            <Circle
              key={index}
              cx={xScale(new Date(point.x))}
              cy={yScale(point.y)}
              r={3}
              fill={colors.chartLine[0]}
            />
          ))}

          {/* Точки второй линии */}
          {secondData &&
            y2Scale &&
            secondData.map((point, index) => (
              <Circle
                key={`second-${index}`}
                cx={xScale(new Date(point.x))}
                cy={y2Scale(point.y)}
                r={3}
                fill={secondAxisColor}
              />
            ))}

          {/* Ось X */}
          <Line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke={colors.text}
            strokeWidth={1}
          />

          {/* Подписи оси X */}
          {xTicks.map((tick) => (
            <SvgText
              key={tick.getTime()}
              x={xScale(tick)}
              y={innerHeight + 15}
              fontSize={10}
              fill={colors.text}
              textAnchor="middle"
              transform={`rotate(-45 ${xScale(tick)} ${innerHeight + 15})`}
            >
              {formatDate(tick)}
            </SvgText>
          ))}

          {/* Подписи осей */}
          <SvgText
            x={-innerHeight / 2}
            y={-10}
            fontSize={12}
            fill={colors.text}
            textAnchor="middle"
            transform={`rotate(-90 ${-innerHeight / 2} ${-10})`}
          >
            Калории
          </SvgText>

          {secondData && (
            <SvgText
              x={innerWidth + 10}
              y={-innerHeight / 2}
              fontSize={12}
              fill={secondAxisColor}
              textAnchor="middle"
              transform={`rotate(90 ${innerWidth + 10} ${-innerHeight / 2})`}
            >
              {secondYAxisLabel}
            </SvgText>
          )}
        </G>
      </Svg>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default Plot;
