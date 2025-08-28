import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 70;
const STROKE_WIDTH = 4;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CountDown() {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev - 1 === 0) {
          clearInterval(interval);
          return 0
        }
        return prev - 1
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Svg width={SIZE} height={SIZE}>
        {/* Background circle */}
        <Circle
          stroke="#001d5b"
          fill="none"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
        />
        {/* Progress circle */}
        <Circle
          stroke="#fff"
          fill="none"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - seconds / 30)}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <Text className="absolute  text-secondary ">{seconds}s</Text>
    </>
  )
}
