import { useEffect, useRef, type ReactNode } from "react";
import { Animated } from "react-native";

interface Props {
  children: ReactNode;
  atraso?: number;
}

export function Aparicao({ children, atraso = 0 }: Props) {
  const opacidade = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 460,
        delay: atraso,
        useNativeDriver: true,
      }),
      Animated.timing(deslocamento, {
        toValue: 0,
        duration: 460,
        delay: atraso,
        useNativeDriver: true,
      }),
    ]).start();
  }, [atraso, deslocamento, opacidade]);

  return (
    <Animated.View style={{ opacity: opacidade, transform: [{ translateY: deslocamento }] }}>
      {children}
    </Animated.View>
  );
}
