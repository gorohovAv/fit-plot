import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface TimerProps {
  duration: number; // продолжительность таймера в секундах
  size?: number; // размер компонента
  strokeWidth?: number; // толщина кольца
  onEnd?: () => void; // колбэк по завершению
}

const getColor = (progress: number) => {
  if (progress < 0.4) return "#4caf50"; // зеленый
  if (progress < 0.7) return "#ffeb3b"; // желтый
  return "#f44336"; // красный
};

const polarToCartesian = (center: number, radius: number, angle: number) => {
  const a = ((angle - 90) * Math.PI) / 180.0;
  return {
    x: center + radius * Math.cos(a),
    y: center + radius * Math.sin(a),
  };
};

const describeArc = (
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesian(center, radius, endAngle);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "L",
    center,
    center,
    "Z",
  ].join(" ");
};

const Timer: React.FC<TimerProps> = ({
  duration,
  size = 80,
  strokeWidth = 10,
  onEnd,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setElapsed(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        console.log(`Таймер: ${next} из ${duration}`);
        if (next >= duration) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onEnd && onEnd();
          return duration;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [duration, onEnd]);

  const progress = elapsed / duration;
  const angle = 360 * progress;
  const color = getColor(progress);

  const center = size / 2;
  const radius = center - strokeWidth / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {elapsed < duration && (
          <Path
            d={describeArc(center, radius, 0, angle)}
            fill={color}
            opacity={0.7}
          />
        )}
      </Svg>
    </View>
  );
};

export default Timer;
