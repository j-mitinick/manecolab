import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { BarraInferior } from "./BarraInferior";
import { CabecalhoApp } from "./CabecalhoApp";
import { FundoClinico } from "./FundoClinico";

export function MolduraApp({ children }: { children: ReactNode }) {
  return (
    <FundoClinico>
      <View style={estilos.coluna}>
        <CabecalhoApp />
        <View style={estilos.flex}>{children}</View>
        <BarraInferior />
      </View>
    </FundoClinico>
  );
}

const estilos = StyleSheet.create({
  coluna: { flex: 1 },
  flex: { flex: 1 },
});
