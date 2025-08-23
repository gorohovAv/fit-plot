import React from "react";
import { View, ScrollView, StyleSheet, Dimensions, Text } from "react-native";
import { Canvas, Path, Rect } from "@shopify/react-native-skia";
import * as d3 from "d3";
import HorizontalAxis from "./HorizontalAxis";
import VerticalAxis from "./VerticalAxis";

type DataPoint = {
  x: string;
  y: number;
};

type Dataset = {
  data: DataPoint[];
  axisLabel: string;
};

type Zone = {
  startDate: string;
  endDate: string;
  color: string;
};

type LegendItem = {
  label: string;
  color: string;
};

type PlotProps = {
  datasets: Dataset[];
  lineColors: string[];
  axisColors: {
    axis: string;
    labels: string;
    background: string;
  };
  zones: Zone[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showLegend?: boolean;
  legendItems?: LegendItem[];
};

const Legend: React.FC<{ items: LegendItem[]; textColor: string }> = ({
  items,
  textColor,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.legendContainer}>
      {items.map((item, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
          <Text style={[styles.legendText, { color: textColor }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const Plot: React.FC<PlotProps> = ({
  datasets,
  lineColors,
  axisColors,
  zones,
  width = Dimensions.get("window").width - 32,
  height = 300,
  margin = { top: 20, right: 80, bottom: 100, left: 80 },
  showLegend = false,
  legendItems = [],
}) => {
  const horizontalAxisRef = React.useRef<ScrollView>(null);

  console.log("=== PLOT RENDER DEBUG ===");
  console.log("datasets:", datasets);
  console.log("datasets.length:", datasets?.length);
  console.log("lineColors:", lineColors);
  console.log("lineColors.length:", lineColors?.length);

  if (!datasets || datasets.length === 0) {
    console.log("No datasets, returning empty view");
    return <View style={styles.container} />;
  }

  const chartWidth = Math.max(width * 2, 800);
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allDataPoints = datasets.flatMap((dataset) => dataset.data);
  const allDates = allDataPoints.map((point) => new Date(point.x));

  console.log("allDataPoints.length:", allDataPoints.length);
  console.log("allDates:", allDates);

  const xScale = d3
    .scaleTime()
    .domain([d3.min(allDates) as Date, d3.max(allDates) as Date])
    .range([0, innerWidth])
    .nice();

  const allValues = datasets.flatMap((dataset) => dataset.data.map((d) => d.y));
  const globalYMin = Math.min(0, d3.min(allValues) ?? 0);
  const globalYMax = d3.max(allValues) ?? 0;
  const globalYPadding = (globalYMax - globalYMin) * 0.1;
  const globalYDomain = [
    globalYMin - globalYPadding,
    globalYMax + globalYPadding,
  ];

  const yScale = d3
    .scaleLinear()
    .domain(globalYDomain as [number, number])
    .range([innerHeight, 0]);

  const linePaths = datasets.map((dataset, datasetIndex) => {
    console.log(`Creating linePath for dataset ${datasetIndex}:`, dataset);

    const lineGenerator = d3
      .line<DataPoint>()
      .x((d: DataPoint) => xScale(new Date(d.x)))
      .y((d: DataPoint) => yScale(d.y))
      .defined((d: DataPoint) => d.y > 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    const pathData = lineGenerator(dataset.data) || "";
    const color = lineColors[datasetIndex % lineColors.length];
    console.log(
      `Dataset ${datasetIndex} path length: ${pathData.length}, color: ${color}`
    );

    return {
      path: pathData,
      color: color,
    };
  });

  console.log("linePaths created:", linePaths.length);

  const zoneRects = zones.map((zone) => {
    const x1 = xScale(new Date(zone.startDate));
    const x2 = xScale(new Date(zone.endDate));
    const x = Math.max(0, Math.min(x1, x2));
    const w = Math.max(0, Math.abs(x2 - x1));

    return {
      x,
      y: 0,
      width: w,
      height: innerHeight,
      color: zone.color,
    };
  });

  // Определяем уникальные единицы измерения
  const uniqueAxisLabels = [
    ...new Set(datasets.map((dataset) => dataset.axisLabel)),
  ];
  console.log("Unique axis labels:", uniqueAxisLabels);

  return (
    <View style={styles.plotContainer}>
      {/* Левая ось - всегда показываем */}
      <VerticalAxis
        data={allDataPoints}
        height={height}
        margin={margin}
        color={axisColors.labels}
        position="left"
        axisLabel={uniqueAxisLabels[0] || datasets[0]?.axisLabel}
        backgroundColor={axisColors.background}
        yScale={yScale}
      />

      {/* Правая ось - показываем только если есть разные единицы измерения */}
      {uniqueAxisLabels.length > 1 && (
        <VerticalAxis
          data={allDataPoints}
          height={height}
          margin={margin}
          color={axisColors.labels}
          position="right"
          axisLabel={uniqueAxisLabels[1]}
          backgroundColor={axisColors.background}
          yScale={yScale}
        />
      )}

      <View
        style={[
          styles.chartContainer,
          {
            marginLeft: margin.left,
            marginRight: margin.right,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: chartWidth }}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const scrollX = event.nativeEvent.contentOffset.x;
            if (horizontalAxisRef.current) {
              horizontalAxisRef.current.scrollTo({
                x: scrollX,
                animated: false,
              });
            }
          }}
        >
          <View style={styles.canvasContainer}>
            <Canvas style={{ width: chartWidth, height }}>
              <Rect
                x={0}
                y={0}
                width={chartWidth}
                height={height}
                color={axisColors.background}
              />

              <Rect
                x={margin.left}
                y={margin.top}
                width={innerWidth}
                height={innerHeight}
                color={axisColors.background}
              />

              {zoneRects.map((zone, index) => (
                <Rect
                  key={`zone-${index}`}
                  x={zone.x + margin.left}
                  y={zone.y + margin.top}
                  width={zone.width}
                  height={zone.height}
                  color={zone.color}
                  opacity={0.3}
                />
              ))}

              {linePaths.map((linePath, index) => (
                <Path
                  key={`line-${index}`}
                  path={linePath.path}
                  color={linePath.color}
                  strokeWidth={2}
                  style="stroke"
                />
              ))}
            </Canvas>
          </View>
        </ScrollView>
      </View>

      <View
        style={[
          styles.chartContainer,
          {
            marginLeft: margin.left - 60,
            marginRight: margin.right,
            position: "absolute",
            top: margin.top + innerHeight,
            bottom: 0,
            overflow: "hidden",
          },
        ]}
      >
        <ScrollView
          ref={horizontalAxisRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: chartWidth }}
          scrollEnabled={false}
        >
          <HorizontalAxis
            data={allDataPoints}
            width={chartWidth}
            height={height}
            margin={margin}
            color={axisColors.labels}
            xScale={xScale}
          />
        </ScrollView>
      </View>

      {showLegend && legendItems.length > 0 && (
        <Legend items={legendItems} textColor={axisColors.labels} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  plotContainer: {
    position: "relative",
  },
  chartContainer: {
    position: "relative",
    minHeight: 300,
  },
  canvasContainer: {
    position: "relative",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default Plot;
