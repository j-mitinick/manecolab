import { StyleSheet, Text, View } from "react-native";

import { tema } from "../theme/theme";
import type { FuncaoNome } from "../types/api";
import { ROTULO_FUNCAO } from "../utils/rotulos";

export function BadgeFuncao({ funcao }: { funcao: FuncaoNome }) {
  return (
    <View style={estilos.badge}>
      <Text style={estilos.texto}>{ROTULO_FUNCAO[funcao]}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E5F3FB",
    borderRadius: tema.raio.pill,
    paddingHorizontal: tema.espaco.sm,
    paddingVertical: tema.espaco.xs,
  },
  texto: {
    color: tema.cores.teal,
    fontSize: tema.tipo.xs,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
