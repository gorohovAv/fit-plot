import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import {
  Canvas,
  Path,
  Line,
  Text,
  Rect,
  useFont,
  Skia,
  vec,
  useValue,
  useComputedValue,
  useSharedValueEffect,
  useValueEffect,
} from "@shopify/react-native-skia";
import * as d3 from "d3";

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
  const font = useFont(require("../assets/fonts/SpaceMono-Regular.ttf"), 10);
  const titleFont = useFont(
    require("../assets/fonts/SpaceMono-Regular.ttf"),
    12
  );

  if (!datasets || datasets.length === 0 || !font || !titleFont) {
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
    const yMin = Math.min(0, d3.min(dataset.data, (d) => d.y) ?? 0);
    const yMax = d3.max(dataset.data, (d) => d.y) ?? 0;
    const yPadding = (yMax - yMin) * 0.1;
    const yDomain = [yMin - yPadding, yMax + yPadding];

    return d3
      .scaleLinear()
      .domain(yDomain as [number, number])
      .range([innerHeight, 0]);
  });

  const xTicks = xScale.ticks(Math.min(8, allDates.length));
  const yTicks = yScales.map((scale) => scale.ticks(5));

  const formatDate = (date: Date) => d3.timeFormat("%d.%m")(date);

  const linePaths = datasets.map((dataset, datasetIndex) => {
    const yScale = yScales[datasetIndex];

    const lineGenerator = d3
      .line<DataPoint>()
      .x((d) => xScale(new Date(d.x)))
      .y((d) => yScale(d.y))
      .defined((d) => d.y > 0)
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ width: chartWidth }}
    >
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

        {yTicks.map((ticks, scaleIndex) =>
          ticks.map((tick) => (
            <Line
              key={`grid-y-${scaleIndex}-${tick}`}
              p1={vec(margin.left, yScales[scaleIndex](tick) + margin.top)}
              p2={vec(
                margin.left + innerWidth,
                yScales[scaleIndex](tick) + margin.top
              )}
              color={axisColors.axis}
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))
        )}

        {xTicks.map((tick) => (
          <Line
            key={`grid-x-${tick.getTime()}`}
            p1={vec(xScale(tick) + margin.left, margin.top)}
            p2={vec(xScale(tick) + margin.left, margin.top + innerHeight)}
            color={axisColors.axis}
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        {yScales.map((yScale, scaleIndex) => (
          <Line
            key={`axis-y-${scaleIndex}`}
            p1={vec(
              scaleIndex === 0 ? margin.left : margin.left + innerWidth,
              margin.top
            )}
            p2={vec(
              scaleIndex === 0 ? margin.left : margin.left + innerWidth,
              margin.top + innerHeight
            )}
            color={axisColors.axis}
            strokeWidth={1}
          />
        ))}

        <Line
          p1={vec(margin.left, margin.top + innerHeight)}
          p2={vec(margin.left + innerWidth, margin.top + innerHeight)}
          color={axisColors.axis}
          strokeWidth={1}
        />

        {yTicks.map((ticks, scaleIndex) =>
          ticks.map((tick) => (
            <Text
              key={`label-y-${scaleIndex}-${tick}`}
              x={
                scaleIndex === 0
                  ? margin.left - 10
                  : margin.left + innerWidth + 10
              }
              y={yScales[scaleIndex](tick) + margin.top + 4}
              text={Math.round(tick).toString()}
              font={font}
              color={axisColors.labels}
            />
          ))
        )}

        {xTicks.map((tick) => (
          <Text
            key={`label-x-${tick.getTime()}`}
            x={xScale(tick) + margin.left}
            y={margin.top + innerHeight + 20}
            text={formatDate(tick)}
            font={font}
            color={axisColors.labels}
            transform={[{ rotate: -Math.PI / 2 }]}
          />
        ))}

        {datasets.map((dataset, datasetIndex) => (
          <Text
            key={`axis-title-${datasetIndex}`}
            x={
              datasetIndex === 0
                ? margin.left - 35
                : margin.left + innerWidth + 35
            }
            y={margin.top + innerHeight / 2}
            text={dataset.axisLabel}
            font={titleFont}
            color={axisColors.labels}
            transform={[
              { rotate: datasetIndex === 0 ? -Math.PI / 2 : Math.PI / 2 },
            ]}
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

        {datasets.map((dataset, datasetIndex) =>
          dataset.data
            .filter((point) => point.y > 0)
            .map((point, pointIndex) => {
              const x = xScale(new Date(point.x));
              const y = yScales[datasetIndex](point.y);

              return (
                <Rect
                  key={`point-${datasetIndex}-${pointIndex}`}
                  x={x + margin.left - 2}
                  y={y + margin.top - 2}
                  width={4}
                  height={4}
                  color={lineColors[datasetIndex % lineColors.length]}
                />
              );
            })
        )}
      </Canvas>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default Plot;
