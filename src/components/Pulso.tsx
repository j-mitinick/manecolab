import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { tema } from "../theme/theme";

export function Pulso() {
  const escala = useRef(new Animated.Value(0.86)).current;
  const opacidade = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(escala, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(escala, { toValue: 0.86, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacidade, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(opacidade, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [escala, opacidade]);

  return <Animated.View style={[estilos.anel, { opacity: opacidade, transform: [{ scale: escala }] }]} />;
}

const estilos = StyleSheet.create({
  anel: {
    width: 72,
    height: 72,
    borderRadius: tema.raio.pill,
    borderWidth: 3,
    borderColor: tema.cores.ciano,
    backgroundColor: "rgba(61, 220, 255, 0.12)",
  },
});
