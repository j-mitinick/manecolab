import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from "react-native";

import { sombraCartao, tema } from "../theme/theme";

type Variante = "primario" | "teal" | "perigo" | "contorno";

interface Props {
  titulo: string;
  onPress: () => void;
  disabled?: boolean;
  aCarregar?: boolean;
  variante?: Variante;
}

export function BotaoPrimario({
  titulo,
  onPress,
  disabled = false,
  aCarregar = false,
  variante = "primario",
}: Props) {
  const inactivo = disabled || aCarregar;
  const escala = useRef(new Animated.Value(1)).current;

  function animar(para: number) {
    Animated.spring(escala, { toValue: para, useNativeDriver: true, speed: 28, bounciness: 4 }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        accessibilityRole="button"
        disabled={inactivo}
        onPress={onPress}
        onPressIn={() => animar(0.97)}
        onPressOut={() => animar(1)}
        style={[estilos.base, estilos[variante], variante !== "contorno" && sombraCartao, inactivo && estilos.inactivo]}
      >
        {aCarregar ? (
          <ActivityIndicator color={variante === "contorno" ? tema.cores.primario : tema.cores.branco} />
        ) : (
          <Text style={[estilos.texto, variante === "contorno" && estilos.textoContorno]}>{titulo}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: tema.alturaToque,
    borderRadius: tema.raio.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tema.espaco.xl,
    paddingVertical: tema.espaco.md,
  },
  primario: { backgroundColor: tema.cores.primario },
  teal: { backgroundColor: tema.cores.teal },
  perigo: { backgroundColor: tema.cores.erro },
  contorno: {
    backgroundColor: tema.cores.superficie,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
  },
  inactivo: { opacity: tema.opacidadeDesactivado },
  texto: { color: tema.cores.branco, fontSize: tema.tipo.md, fontWeight: "700" },
  textoContorno: { color: tema.cores.texto },
});
