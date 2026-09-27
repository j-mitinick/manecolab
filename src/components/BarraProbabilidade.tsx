import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { tema } from "../theme/theme";
import { percentagem } from "../utils/rotulos";

interface Props {
  rotulo: string;
  probabilidade: number;
  destacada?: boolean;
  incerta?: boolean;
  compacta?: boolean;
}

export function BarraProbabilidade({
  rotulo,
  probabilidade,
  destacada = false,
  incerta = false,
  compacta = false,
}: Props) {
  const fraccao = Math.max(0, Math.min(1, probabilidade));
  const progresso = useRef(new Animated.Value(0)).current;
  const contorno = destacada && incerta;

  useEffect(() => {
    progresso.setValue(0);
    Animated.timing(progresso, {
      toValue: fraccao,
      duration: 720,
      useNativeDriver: false,
    }).start();
  }, [fraccao, progresso]);

  const largura = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const cores = contorno
    ? ([tema.cores.alerta, "#9A3412"] as const)
    : destacada
      ? ([tema.cores.ciano, tema.cores.primario] as const)
      : (["#7DD3C7", tema.cores.teal] as const);

  return (
    <View
      accessibilityLabel={`${rotulo}: ${percentagem(fraccao)}`}
      style={[estilos.bloco, contorno && estilos.contorno, destacada && !contorno && estilos.destacada]}
    >
      <View style={estilos.linha}>
        <Text style={[estilos.rotulo, destacada && estilos.rotuloForte]}>{rotulo}</Text>
        <Text style={estilos.valor}>{percentagem(fraccao)}</Text>
      </View>
      <View style={[estilos.trilho, compacta && estilos.trilhoCompacto]}>
        <Animated.View style={[estilos.enchimento, compacta && estilos.trilhoCompacto, { width: largura }]}>
          <LinearGradient colors={cores} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.gradiente} />
          {destacada && !compacta ? <View style={estilos.marca} /> : null}
        </Animated.View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: {
    gap: tema.espaco.xs,
    paddingVertical: tema.espaco.xs,
    borderRadius: tema.raio.sm,
  },
  destacada: {},
  contorno: {
    backgroundColor: tema.cores.alertaFundo,
    borderColor: tema.cores.alerta,
    borderWidth: tema.linhaBorda,
    paddingHorizontal: tema.espaco.sm,
    paddingVertical: tema.espaco.sm,
  },
  linha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rotulo: { color: tema.cores.muted, fontSize: tema.tipo.sm },
  rotuloForte: { color: tema.cores.texto, fontWeight: "700" },
  valor: { color: tema.cores.texto, fontSize: tema.tipo.sm, fontWeight: "700", fontVariant: ["tabular-nums"] },
  trilho: {
    height: tema.alturaBarra,
    borderRadius: tema.raio.pill,
    backgroundColor: tema.cores.barraFundo,
    overflow: "hidden",
  },
  trilhoCompacto: { height: tema.alturaBarraCompacta },
  enchimento: { height: tema.alturaBarra, borderRadius: tema.raio.pill, overflow: "hidden" },
  gradiente: { flex: 1 },
  marca: {
    position: "absolute",
    right: 2,
    top: 2,
    width: 8,
    height: 8,
    borderRadius: tema.raio.pill,
    backgroundColor: tema.cores.branco,
  },
});
