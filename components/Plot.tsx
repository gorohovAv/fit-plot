import { Canvas, Circle, Path, Rect } from "@shopify/react-native-skia";
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
  const chartScrollRef = React.useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [scrollX, setScrollX] = React.useState(0);

  console.log("=== PLOT RENDER DEBUG ===");
  console.log("datasets:", datasets);
  console.log("datasets.length:", datasets?.length);
  console.log("lineColors:", lineColors);
  console.log("lineColors.length:", lineColors?.length);

  // Убираем вертикальные оси, уменьшаем боковые отступы
  const dynamicMargin = React.useMemo(
    () => ({
      ...margin,
      left: 20,
      right: 20,
    }),
    [margin]
  );

  const chartWidth = Math.max(width * 2, 800);
  const innerWidth = chartWidth - dynamicMargin.left - dynamicMargin.right;
  const innerHeight = height - dynamicMargin.top - dynamicMargin.bottom;

  // Вычисляем масштабы до проверки на пустые данные
  const allDataPoints = datasets?.flatMap((dataset) => dataset.data) || [];
  const allDates = allDataPoints.map((point) => new Date(point.x));

  console.log("allDataPoints.length:", allDataPoints.length);
  console.log("allDates:", allDates);

  const xScale = React.useMemo(() => {
    if (allDates.length === 0) {
      return d3
        .scaleTime()
        .domain([new Date(), new Date()])
        .range([dynamicMargin.left, dynamicMargin.left + innerWidth]);
    }
    return d3
      .scaleTime()
      .domain([d3.min(allDates) as Date, d3.max(allDates) as Date])
      .range([dynamicMargin.left, dynamicMargin.left + innerWidth])
      .nice();
  }, [allDates, innerWidth, dynamicMargin]);

  const allValues =
    datasets?.flatMap((dataset) => dataset.data.map((d) => d.y)) || [];
  const globalYMin = Math.min(0, d3.min(allValues) ?? 0);
  const globalYMax = d3.max(allValues) ?? 0;

  // Fix Y-axis scaling - use proper padding and ensure lines don't exceed axis bounds
  const globalYPadding = Math.max((globalYMax - globalYMin) * 0.1, 1); // Increase padding to 10% with minimum of 1
  const globalYDomain = React.useMemo(
    () => [globalYMin - globalYPadding, globalYMax + globalYPadding],
    [globalYMin, globalYMax, globalYPadding]
  );

  const yScale = React.useMemo(() => {
    return d3
      .scaleLinear()
      .domain(globalYDomain as [number, number])
      .range([dynamicMargin.top + innerHeight, dynamicMargin.top]);
  }, [globalYDomain, innerHeight, dynamicMargin]);

  // Находим ближайшие точки для выбранной даты (должно быть до раннего возврата)
  const selectedPoints = React.useMemo(() => {
    if (!selectedDate || !datasets || datasets.length === 0) return [];

    // Используем координату выбранной даты для X, чтобы точка была точно на линии
    const selectedX = xScale(selectedDate);
    const selectedTime = selectedDate.getTime();

    return datasets
      .map((dataset, datasetIndex) => {
        // Сортируем точки по дате для интерполяции
        const sortedPoints = [...dataset.data]
          .map((p) => ({ ...p, date: new Date(p.x).getTime() }))
          .sort((a, b) => a.date - b.date)
          .filter((p) => p.y > 0);

        if (sortedPoints.length === 0) return null;

        // Находим две ближайшие точки для интерполяции
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

        let interpolatedY: number;
        let displayPoint: DataPoint;

        if (beforePoint && afterPoint && beforePoint.date !== afterPoint.date) {
          // Линейная интерполяция между двумя точками
          const t =
            (selectedTime - beforePoint.date) /
            (afterPoint.date - beforePoint.date);
          interpolatedY = beforePoint.y + t * (afterPoint.y - beforePoint.y);
          displayPoint = {
            x: selectedDate.toISOString(),
            y: interpolatedY,
          };
        } else if (beforePoint) {
          // Используем ближайшую точку до
          interpolatedY = beforePoint.y;
          displayPoint = beforePoint;
        } else if (afterPoint) {
          // Используем ближайшую точку после
          interpolatedY = afterPoint.y;
          displayPoint = afterPoint;
        } else {
          return null;
        }

        if (interpolatedY <= 0) return null;

        // Используем координату выбранной даты для X, чтобы точка была точно на линии
        const x = selectedX;
        const y = yScale(interpolatedY);

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

  // Обработчик тапа на график (должен быть до раннего возврата)
  const handleChartPress = React.useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;

      // locationX относительно Pressable (который имеет ширину chartWidth)
      // Нужно учесть текущий скролл и преобразовать в координату в масштабе графика
      // locationX - это координата относительно Pressable, добавляем scrollX
      const xInChart = locationX + scrollX;

      // Проверяем, что тап внутри области графика с учетом отступов
      if (
        xInChart < dynamicMargin.left ||
        xInChart > dynamicMargin.left + innerWidth ||
        locationY < dynamicMargin.top ||
        locationY > dynamicMargin.top + innerHeight
      ) {
        setSelectedDate(null);
        return;
      }

      // Преобразуем координату X в дату
      const date = xScale.invert(xInChart);
      setSelectedDate(date);
    },
    [dynamicMargin, innerWidth, innerHeight, xScale, scrollX]
  );

  if (!datasets || datasets.length === 0) {
    console.log("No datasets, returning empty view");
    return <View style={styles.container} />;
  }

  // Определяем уникальные единицы измерения
  const uniqueAxisLabels = [
    ...new Set(datasets.map((dataset) => dataset.axisLabel)),
  ];
  console.log("Unique axis labels:", uniqueAxisLabels);

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

                {/* Отображаем точки при тапе */}
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
              </Canvas>

              {/* Отображаем значения над точками внутри ScrollView */}
              {selectedPoints.length > 0 && (
                <View
                  style={[
                    styles.valuesContainer,
                    { width: chartWidth, height },
                  ]}
                  pointerEvents="none"
                >
                  {selectedPoints.map((selectedPoint) => {
                    // Позиция точки в координатах графика (selectedPoint.x уже в масштабе innerWidth)
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
