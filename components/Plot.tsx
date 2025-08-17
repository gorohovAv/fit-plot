import React from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
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
};

const Plot: React.FC<PlotProps> = ({
  datasets,
  lineColors,
  axisColors,
  zones,
  width = Dimensions.get("window").width - 32,
  height = 300,
  margin = { top: 20, right: 80, bottom: 80, left: 80 },
}) => {
  if (!datasets || datasets.length === 0) {
    return <View style={styles.container} />;
  }

  const chartWidth = Math.max(width * 2, 800);
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allDataPoints = datasets.flatMap((dataset) => dataset.data);
  const allDates = allDataPoints.map((point) => new Date(point.x));

  const xScale = d3
    .scaleTime()
    .domain([d3.min(allDates) as Date, d3.max(allDates) as Date])
    .range([0, innerWidth])
    .nice();

  const yScales = datasets.map((dataset) => {
    const yMin = Math.min(0, d3.min(dataset.data, (d: DataPoint) => d.y) ?? 0);
    const yMax = d3.max(dataset.data, (d: DataPoint) => d.y) ?? 0;
    const yPadding = (yMax - yMin) * 0.1;
    const yDomain = [yMin - yPadding, yMax + yPadding];

    return d3
      .scaleLinear()
      .domain(yDomain as [number, number])
      .range([innerHeight, 0]);
  });

  const linePaths = datasets.map((dataset, datasetIndex) => {
    const yScale = yScales[datasetIndex];

    const lineGenerator = d3
      .line<DataPoint>()
      .x((d: DataPoint) => xScale(new Date(d.x)))
      .y((d: DataPoint) => yScale(d.y))
      .defined((d: DataPoint) => d.y > 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    const pathData = lineGenerator(dataset.data) || "";
    return {
      path: pathData,
      color: lineColors[datasetIndex % lineColors.length],
    };
  });

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
        data={datasets[0]?.data || []}
        height={height}
        margin={margin}
        color={axisColors.labels}
        position="left"
        axisLabel={datasets[0]?.axisLabel}
      />

      <VerticalAxis
        data={datasets[1]?.data || datasets[0]?.data || []}
        height={height}
        margin={margin}
        color={axisColors.labels}
        position="right"
        axisLabel={datasets[1]?.axisLabel}
      />

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
          styles.horizontalAxisContainer,
          {
            left: margin.left,
            right: margin.right,
          },
        ]}
      >
        <ScrollView
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
          />
        </ScrollView>
      </View>
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
  },
  canvasContainer: {
    position: "relative",
  },
  horizontalAxisContainer: {
    position: "absolute",
    bottom: 0,
  },
});

export default Plot;
