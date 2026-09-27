import { useContext, type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { tema } from "../theme/theme";
import { AlvoVidroContext } from "./FundoClinico";

interface Props {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensidade?: number;
  isolado?: boolean;
}

export function Vidro({ children, style, intensidade = 48, isolado = false }: Props) {
  const alvo = useContext(AlvoVidroContext);
  const raio = Number(StyleSheet.flatten(style)?.borderRadius ?? tema.raio.lg);
  const android = Platform.OS === "android" && !isolado && alvo;
  return (
    <View style={[estilos.sombra, style]}>
      <View pointerEvents="none" style={[estilos.fundo, { borderRadius: raio }]}>
        <BlurView
          intensity={intensidade}
          tint="systemUltraThinMaterialLight"
          blurMethod={android ? "dimezisBlurView" : undefined}
          blurTarget={android ? alvo : undefined}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.66)", "rgba(255,255,255,0.16)", "rgba(255,255,255,0.36)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={estilos.reflexo} />
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  sombra: {
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: tema.linhaBorda,
    borderColor: "rgba(255,255,255,0.74)",
    shadowColor: "#7EABD0",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    elevation: 6,
  },
  fundo: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  reflexo: {
    position: "absolute",
    top: 0,
    left: tema.espaco.lg,
    right: tema.espaco.lg,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
});
