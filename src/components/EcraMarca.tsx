import { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, Text, View } from "react-native";

import { tema } from "../theme/theme";

interface Props {
  legenda?: string | null;
}

export function EcraMarca({ legenda = null }: Props) {
  const escala = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(escala, { toValue: 0.92, duration: 800, useNativeDriver: true }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [escala]);

  return (
    <ImageBackground source={require("../../assets/login-fundo.jpg")} style={estilos.ecra} resizeMode="cover">
      <View style={estilos.centro}>
        <Animated.Image
          source={require("../../assets/logo-sem-fundo.png")}
          accessibilityLabel="ManecoLab"
          resizeMode="contain"
          style={[estilos.logo, { transform: [{ scale: escala }] }]}
        />
        {legenda ? <Text style={estilos.legenda}>{legenda}</Text> : null}
      </View>
    </ImageBackground>
  );
}

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: tema.cores.marinhoProfundo },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: tema.espaco.xl },
  logo: { width: 240, height: 120 },
  legenda: { color: tema.cores.loginTexto, fontSize: tema.tipo.md, fontWeight: "600" },
});
