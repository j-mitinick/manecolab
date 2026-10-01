import { createContext, useRef, type ReactNode, type RefObject } from "react";
import { Image, StyleSheet, View } from "react-native";
import { BlurTargetView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { tema } from "../theme/theme";

export const AlvoVidroContext = createContext<RefObject<View | null> | null>(null);

export function FundoClinico({ children, imagem = false }: { children: ReactNode; imagem?: boolean }) {
  const alvo = useRef<View>(null);
  return (
    <AlvoVidroContext.Provider value={alvo}>
      <View style={estilos.flex}>
        <BlurTargetView ref={alvo} style={estilos.alvo} pointerEvents="none">
          {imagem ? (
            <Image source={require("../../assets/login-fundo.jpg")} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={[tema.cores.gradienteTopo, tema.cores.gradienteMeio, tema.cores.fundo]}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
        </BlurTargetView>
        {children}
      </View>
    </AlvoVidroContext.Provider>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  alvo: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
});
