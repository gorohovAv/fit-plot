import { Canvas, Circle, Line, Path, Rect } from "@shopify/react-native-skia";
import * as d3 from "d3";
import React from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import HorizontalAxis from "./HorizontalAxis";

type DataPoint = {
  x: string;
  y: number;
};

type Dataset = {
  data: DataPoint[];
  axisLabel: string;
  name?: string;
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
  const chartScrollRef = React.useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [scrollX, setScrollX] = React.useState(0);

  //console.log("=== PLOT RENDER DEBUG ===");
  //console.log("datasets:", datasets);
  //console.log("datasets.length:", datasets?.length);
  //console.log("lineColors:", lineColors);
  //console.log("lineColors.length:", lineColors?.length);

  const dynamicMargin = React.useMemo(
    () => ({
      ...margin,
      left: 20,
      right: 20,
    }),
    [margin],
  );

  const chartWidth = Math.max(width * 2, 800);
  const innerWidth = chartWidth - dynamicMargin.left - dynamicMargin.right;
  const innerHeight = height - dynamicMargin.top - dynamicMargin.bottom;

  const allDataPoints = datasets?.flatMap((dataset) => dataset.data) || [];
  const allDates = allDataPoints.map((point) => new Date(point.x));

  //console.log("allDataPoints.length:", allDataPoints.length);
  //console.log("allDates:", allDates);

  const xScale = React.useMemo(() => {
    if (allDates.length === 0) {
      return d3
        .scaleTime()
        .domain([new Date(), new Date()])
        .range([dynamicMargin.left, dynamicMargin.left + innerWidth]);
    }

    const minDate = d3.min(allDates) as Date;
    const maxDate = d3.max(allDates) as Date;

    const domain =
      minDate.getTime() === maxDate.getTime()
        ? [new Date(minDate.getTime() - 1), new Date(maxDate.getTime() + 1)]
        : [minDate, maxDate];

    const scale = d3.scaleTime().domain(domain);

    return scale.range([dynamicMargin.left, dynamicMargin.left + innerWidth]);
  }, [allDates, innerWidth, dynamicMargin]);

  const allValues =
    datasets?.flatMap((dataset) => dataset.data.map((d) => d.y)) || [];
  const globalYMin = Math.min(0, d3.min(allValues) ?? 0);
  const globalYMax = d3.max(allValues) ?? 0;

  const globalYPadding = Math.max((globalYMax - globalYMin) * 0.1, 1);
  const globalYDomain = React.useMemo(
    () => [globalYMin - globalYPadding, globalYMax + globalYPadding],
    [globalYMin, globalYMax, globalYPadding],
  );

  const yScale = React.useMemo(() => {
    return d3
      .scaleLinear()
      .domain(globalYDomain as [number, number])
      .range([dynamicMargin.top + innerHeight, dynamicMargin.top]);
  }, [globalYDomain, innerHeight, dynamicMargin]);

  const selectedPoints = React.useMemo(() => {
    if (!selectedDate || !datasets || datasets.length === 0) {
      console.log("=== SELECTED POINTS DEBUG ===");
      console.log("No selected date or datasets, returning empty array");
      return [];
    }

    console.log("=== SELECTED POINTS DEBUG ===");
    console.log("Processing selected date:", selectedDate.toISOString());

    const selectedX = xScale(selectedDate);
    console.log("Calculated selectedX from xScale:", selectedX);
    const selectedTime = selectedDate.getTime();
    console.log("Selected time in milliseconds:", selectedTime);

    return datasets
      .map((dataset, datasetIndex) => {
        console.log(`Processing dataset ${datasetIndex}`);

        const sortedPoints = [...dataset.data]
          .map((p) => ({ ...p, date: new Date(p.x).getTime() }))
          .sort((a, b) => a.date - b.date)
          .filter((p) => p.y > 0);

        console.log(
          `Dataset ${datasetIndex} has ${sortedPoints.length} valid points after filtering`,
        );

        if (sortedPoints.length === 0) return null;

        let beforePoint: (typeof sortedPoints)[0] | null = null;
        let afterPoint: (typeof sortedPoints)[0] | null = null;

        for (let i = 0; i < sortedPoints.length; i++) {
          if (sortedPoints[i].date <= selectedTime) {
            beforePoint = sortedPoints[i];
          }
          if (sortedPoints[i].date >= selectedTime && !afterPoint) {
            afterPoint = sortedPoints[i];
            break;
          }
        }

        console.log(
          `Dataset ${datasetIndex}: beforePoint date:`,
          beforePoint ? new Date(beforePoint.date).toISOString() : "null",
        );
        console.log(
          `Dataset ${datasetIndex}: afterPoint date:`,
          afterPoint ? new Date(afterPoint.date).toISOString() : "null",
        );

        let interpolatedY: number;
        let displayPoint: DataPoint;

        if (beforePoint && afterPoint && beforePoint.date !== afterPoint.date) {
          const t =
            (selectedTime - beforePoint.date) /
            (afterPoint.date - beforePoint.date);
          interpolatedY = beforePoint.y + t * (afterPoint.y - beforePoint.y);
          displayPoint = {
            x: selectedDate.toISOString(),
            y: interpolatedY,
          };
          console.log(
            `Dataset ${datasetIndex}: Interpolated Y value:`,
            interpolatedY,
          );
        } else if (beforePoint) {
          interpolatedY = beforePoint.y;
          displayPoint = beforePoint;
          console.log(
            `Dataset ${datasetIndex}: Using beforePoint Y value:`,
            interpolatedY,
          );
        } else if (afterPoint) {
          interpolatedY = afterPoint.y;
          displayPoint = afterPoint;
          console.log(
            `Dataset ${datasetIndex}: Using afterPoint Y value:`,
            interpolatedY,
          );
        } else {
          console.log(
            `Dataset ${datasetIndex}: No points found around selected date, finding closest point`,
          );

          if (sortedPoints.length > 0) {
            let closestPoint = sortedPoints.reduce((closest, current) => {
              const closestDiff = Math.abs(closest.date - selectedTime);
              const currentDiff = Math.abs(current.date - selectedTime);
              return currentDiff < closestDiff ? current : closest;
            });

            if (closestPoint) {
              interpolatedY = closestPoint.y;
              displayPoint = closestPoint;
              console.log(
                `Dataset ${datasetIndex}: Using closest point Y value:`,
                interpolatedY,
              );
            } else {
              console.log(
                `Dataset ${datasetIndex}: Could not determine Y value, returning null`,
              );
              return null;
            }
          } else {
            console.log(
              `Dataset ${datasetIndex}: No valid points in dataset, returning null`,
            );
            return null;
          }
        }

        if (interpolatedY <= 0) {
          console.log(`Dataset ${datasetIndex}: Y value is <= 0, skipping`);
          return null;
        }

        const x = selectedX;
        const y = yScale(interpolatedY);
        console.log(
          `Dataset ${datasetIndex}: Final coordinates - x: ${x}, y: ${y}`,
        );

        return {
          datasetIndex,
          point: displayPoint,
          x,
          y,
          color: lineColors[datasetIndex % lineColors.length],
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [selectedDate, datasets, lineColors, xScale, yScale]);

  const handleChartPress = React.useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;

      console.log("=== TAP COORDINATES DEBUG ===");
      console.log("locationX (relative to Pressable):", locationX);
      console.log("locationY (relative to Pressable):", locationY);
      console.log("scrollX (current scroll offset):", scrollX);

      const xInChart = locationX;

      console.log("xInChart (absolute position in chart):", xInChart);
      console.log("dynamicMargin.left:", dynamicMargin.left);
      console.log(
        "dynamicMargin.left + innerWidth:",
        dynamicMargin.left + innerWidth,
      );
      console.log("innerWidth:", innerWidth);
      console.log("dynamicMargin.top:", dynamicMargin.top);
      console.log(
        "dynamicMargin.top + innerHeight:",
        dynamicMargin.top + innerHeight,
      );

      const tolerance = 10;
      if (
        locationY < dynamicMargin.top - tolerance ||
        locationY > dynamicMargin.top + innerHeight + tolerance
      ) {
        console.log("Tap is outside vertical chart area, deselecting date");
        setSelectedDate(null);
        return;
      }

      const chartStartX = dynamicMargin.left;
      const chartEndX = dynamicMargin.left + innerWidth;

      const clampedX = Math.max(chartStartX, Math.min(xInChart, chartEndX));

      let date: Date;

      const [minX, maxX] = xScale.range();
      const [minDate, maxDate] = xScale.domain() as [Date, Date];

      if (clampedX >= minX && clampedX <= maxX) {
        date = xScale.invert(clampedX);
        console.log("Converted x position to date:", date);
      } else if (clampedX < minX) {
        date = minDate;
        console.log(
          "Position is before data range, using earliest date:",
          date,
        );
      } else {
        date = maxDate;
        console.log("Position is after data range, using latest date:", date);
      }

      console.log("Final date from xScale:", date);
      console.log("Formatted date string:", date.toISOString());
      setSelectedDate(date);
    },
    [dynamicMargin, innerWidth, innerHeight, xScale, scrollX],
  );

  if (!datasets || datasets.length === 0) {
    console.log("No datasets, returning empty view");
    return <View style={styles.container} />;
  }

  const uniqueAxisLabels = [
    ...new Set(datasets.map((dataset) => dataset.axisLabel)),
  ];
  //console.log("Unique axis labels:", uniqueAxisLabels);

  const linePaths = datasets.map((dataset, datasetIndex) => {
    //console.log(`Creating linePath for dataset ${datasetIndex}:`, dataset);

    const lineGenerator = d3
      .line<DataPoint>()
      .x((d: DataPoint) => xScale(new Date(d.x)))
      .y((d: DataPoint) => yScale(d.y))
      .defined((d: DataPoint) => d.y > 0)
      .curve(d3.curveCatmullRom.alpha(0.5));

    const pathData = lineGenerator(dataset.data) || "";
    const color = lineColors[datasetIndex % lineColors.length];
    //console.log(
    //`Dataset ${datasetIndex} path length: ${pathData.length}, color: ${color}`
    //);

    return {
      path: pathData,
      color: color,
    };
  });

  const autoLegendItems = datasets.map((dataset, index) => ({
    label: dataset.name || dataset.axisLabel,
    color: lineColors[index % lineColors.length],
  }));

  const finalLegendItems =
    legendItems.length > 0 ? legendItems : autoLegendItems;

  const zoneRects = zones.map((zone) => {
    const x1 = xScale(new Date(zone.startDate));
    const x2 = xScale(new Date(zone.endDate));
    const x = Math.max(dynamicMargin.left, Math.min(x1, x2));
    const w = Math.max(0, Math.abs(x2 - x1));

    return {
      x,
      y: dynamicMargin.top,
      width: w,
      height: innerHeight,
      color: zone.color,
    };
  });

  return (
    <View style={styles.plotContainer}>
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
          ref={chartScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: chartWidth }}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const scrollXValue = event.nativeEvent.contentOffset.x;
            setScrollX(scrollXValue);
            if (horizontalAxisRef.current) {
              horizontalAxisRef.current.scrollTo({
                x: scrollXValue,
                animated: false,
              });
            }
          }}
        >
          <Pressable
            onPress={handleChartPress}
            style={[styles.pressableContainer, { width: chartWidth }]}
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
                    x={zone.x}
                    y={zone.y}
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

                {selectedPoints.map((selectedPoint) => (
                  <React.Fragment key={selectedPoint.datasetIndex}>
                    <Circle
                      cx={selectedPoint.x}
                      cy={selectedPoint.y}
                      r={6}
                      color={selectedPoint.color}
                    />
                    <Circle
                      cx={selectedPoint.x}
                      cy={selectedPoint.y}
                      r={4}
                      color={axisColors.background}
                    />
                  </React.Fragment>
                ))}

                {selectedDate && (
                  <>
                    <Line
                      p1={{ x: xScale(selectedDate), y: dynamicMargin.top }}
                      p2={{
                        x: xScale(selectedDate),
                        y: dynamicMargin.top + innerHeight,
                      }}
                      color="#D3D3D3"
                      strokeWidth={1}
                    />
                  </>
                )}
              </Canvas>

              {selectedPoints.length > 0 && (
                <View
                  style={[
                    styles.valuesContainer,
                    { width: chartWidth, height },
                  ]}
                  pointerEvents="none"
                >
                  {selectedPoints.map((selectedPoint) => {
                    const xPosition = selectedPoint.x;
                    const isLeftSide = xPosition < chartWidth / 2;

                    return (
                      <View
                        key={selectedPoint.datasetIndex}
                        style={[
                          styles.valueLabel,
                          {
                            left: isLeftSide ? xPosition : undefined,
                            right: isLeftSide
                              ? undefined
                              : chartWidth - xPosition,
                            top: selectedPoint.y - 30,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.valueLabelContent,
                            { backgroundColor: selectedPoint.color },
                          ]}
                        >
                          <Text style={styles.valueText}>
                            {selectedPoint.point.y.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </Pressable>
        </ScrollView>
      </View>

      <View
        style={[
          styles.axisContainer,
          {
            width: width,
            marginLeft: dynamicMargin.left,
            marginRight: dynamicMargin.right,
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
  axisContainer: {
    position: "relative",
    overflow: "hidden",
  },
  canvasContainer: {
    position: "relative",
  },
  pressableContainer: {
    width: "100%",
  },
  valuesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
    overflow: "visible",
  },
  valueLabel: {
    position: "absolute",
    alignItems: "center",
  },
  valueLabelContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 50,
    alignItems: "center",
  },
  valueText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
