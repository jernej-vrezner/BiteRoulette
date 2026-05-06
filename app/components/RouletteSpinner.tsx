import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const SEGMENTS = 12;
const COLORS = [
  '#C96B4E', '#2C2C2E', '#C96B4E', '#2C2C2E',
  '#C96B4E', '#2C2C2E', '#C96B4E', '#2C2C2E',
  '#C96B4E', '#2C2C2E', '#C96B4E', '#2C2C2E',
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function segmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function RouletteSpinner() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const segAngle = 360 / SEGMENTS;

  return (
    <View style={styles.container}>
      {/* Kazalec na vrhu */}
      <View style={styles.pointer} />

      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={size} height={size}>
          {/* Segmenti */}
          {COLORS.map((color, i) => (
            <Path
              key={i}
              d={segmentPath(cx, cy, r, i * segAngle, (i + 1) * segAngle)}
              fill={color}
              stroke="white"
              strokeWidth={2}
            />
          ))}

          {/* Zunanji obroč */}
          <Circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={4}
          />

          {/* Notranji krog */}
          <Circle cx={cx} cy={cy} r={18} fill="#1a1a1a" />
          <Circle cx={cx} cy={cy} r={10} fill="#C96B4E" />

          {/* Delilne črte */}
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const angle = i * segAngle;
            const inner = polarToCartesian(cx, cy, 18, angle);
            const outer = polarToCartesian(cx, cy, r, angle);
            return (
              <Line
                key={i}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="white"
                strokeWidth={1.5}
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#C96B4E',
    marginBottom: -4,
    zIndex: 10,
  },
});
