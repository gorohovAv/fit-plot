import { Canvas, Path, Rect } from "@shopify/react-native-skia";
import * as d3 from "d3";
import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import HorizontalAxis from "./HorizontalAxis";
import VerticalAxis from "./VerticalAxis";

type DataPoint = {
  x: string;
  y: number;
};

type Dataset = {
  data: DataPoint[];
  axisLabel: string;
  name?: string; // Optional dataset name for legend
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

  // Определяем уникальные единицы измерения
  const uniqueAxisLabels = [
    ...new Set(datasets.map((dataset) => dataset.axisLabel)),
  ];
  console.log("Unique axis labels:", uniqueAxisLabels);

  // Динамически настраиваем отступы в зависимости от количества осей
  const dynamicMargin = {
    ...margin,
    right: uniqueAxisLabels.length > 1 ? margin.right : 20, // Уменьшаем правый отступ если нет второй оси
  };

  const chartWidth = Math.max(width * 2, 800);
  const innerWidth = chartWidth - dynamicMargin.left - dynamicMargin.right;
  const innerHeight = height - dynamicMargin.top - dynamicMargin.bottom;

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

  // Fix Y-axis scaling - use proper padding and ensure lines don't exceed axis bounds
  const globalYPadding = Math.max((globalYMax - globalYMin) * 0.1, 1); // Increase padding to 10% with minimum of 1
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

  // Generate legend items automatically from datasets if not provided
  const autoLegendItems = datasets.map((dataset, index) => ({
    label: dataset.name || dataset.axisLabel,
    color: lineColors[index % lineColors.length],
  }));

  const finalLegendItems = legendItems.length > 0 ? legendItems : autoLegendItems;

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

  return (
    <View style={styles.plotContainer}>
      <VerticalAxis
        data={allDataPoints}
        height={height}
        margin={dynamicMargin}
        color={axisColors.labels}
        position="left"
        axisLabel={uniqueAxisLabels[0] || datasets[0]?.axisLabel}
        backgroundColor={axisColors.background}
        yScale={yScale}
      />

      {uniqueAxisLabels.length > 1 && (
        <VerticalAxis
          data={allDataPoints}
          height={height}
          margin={dynamicMargin}
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
            marginLeft: dynamicMargin.left,
            marginRight: dynamicMargin.right,
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
                x={dynamicMargin.left}
                y={dynamicMargin.top}
                width={innerWidth}
                height={innerHeight}
                color={axisColors.background}
              />

              {zoneRects.map((zone, index) => (
                <Rect
                  key={`zone-${index}`}
                  x={zone.x + dynamicMargin.left}
                  y={zone.y + dynamicMargin.top}
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
            marginLeft: dynamicMargin.left - 60,
            marginRight: dynamicMargin.right,
            position: "absolute",
            top: dynamicMargin.top + innerHeight,
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
            margin={dynamicMargin}
            color={axisColors.labels}
            xScale={xScale}
          />
        </ScrollView>
      </View>

      {showLegend && finalLegendItems.length > 0 && (
        <Legend items={finalLegendItems} textColor={axisColors.labels} />
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
