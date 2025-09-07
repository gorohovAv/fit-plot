import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";
import useTimerStore from "../store/timerStore";

interface TimerProps {
  exerciseId: string;
  duration: number;
  size?: number;
  strokeWidth?: number;
  onEnd?: () => void;
}

const getColor = (progress: number, themeColors: typeof Colors.light) => {
  if (progress < 0.4) return themeColors.success;
  if (progress < 0.7) return themeColors.warning;
  return themeColors.error;
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
  exerciseId,
  duration,
  size = 80,
  strokeWidth = 10,
  onEnd,
}) => {
  const intervalRef = useRef<number | null>(null);
  const theme = useSettingsStore((state) => state.theme);
  const { getTimer, updateTimer, stopTimer } = useTimerStore();

  const timer = getTimer(exerciseId);
  const elapsed = timer?.elapsed || 0;

  const colorScheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    if (!timer) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const currentTimer = getTimer(exerciseId);
      if (!currentTimer) return;

      const nextElapsed = currentTimer.elapsed + 1;
      console.log(`Таймер: ${nextElapsed} из ${duration}`);

      if (nextElapsed >= duration) {
        stopTimer(exerciseId);
        onEnd && onEnd();
      } else {
        updateTimer(exerciseId, nextElapsed);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer?.exerciseId, duration, onEnd, exerciseId, getTimer, updateTimer, stopTimer]);

  // Clean up interval when timer is stopped
  useEffect(() => {
    if (!timer && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timer]);

  if (!timer) {
    return null;
  }

  const progress = elapsed / duration;
  const angle = 360 * progress;
  const color = getColor(progress, themeColors);

  const center = size / 2;
  const radius = center - strokeWidth / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={themeColors.border}
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
