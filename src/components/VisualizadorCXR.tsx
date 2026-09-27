import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { tema } from "../theme/theme";

export interface AccaoImagem {
  titulo: string;
  activo: boolean;
  onPress: () => void;
  disabled?: boolean;
}

interface Props {
  uri: string | null;
  altura: number;
  accoes?: AccaoImagem[];
}

export function VisualizadorCXR({ uri, altura, accoes }: Props) {
  return (
    <View style={[estilos.moldura, { height: altura }]}>
      <View style={estilos.brilho} />
      {uri ? (
        <Image accessibilityLabel="Radiografia de tórax" source={{ uri }} style={estilos.imagem} resizeMode="contain" />
      ) : (
        <View style={estilos.vazioCaixa}>
          <View style={estilos.pulmoes}>
            <View style={estilos.pulmao} />
            <View style={estilos.pulmao} />
          </View>
          <Text style={estilos.vazio}>Escolha uma radiografia de tórax (JPEG ou PNG).</Text>
        </View>
      )}
      {uri && accoes && accoes.length > 0 ? (
        <View style={estilos.accoes}>
          {accoes.map((accao) => (
            <Pressable
              key={accao.titulo}
              accessibilityRole="button"
              accessibilityState={{ selected: accao.activo, disabled: accao.disabled }}
              disabled={accao.disabled}
              onPress={accao.onPress}
              style={[estilos.accao, accao.activo && estilos.accaoActiva, accao.disabled && estilos.accaoInactiva]}
            >
              <Text style={estilos.accaoTexto}>{accao.titulo}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: {
    backgroundColor: tema.cores.visualizador,
    borderRadius: tema.raio.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.visualizadorBorda,
  },
  brilho: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "rgba(61, 220, 255, 0.08)",
  },
  imagem: { width: "100%", height: "100%" },
  vazioCaixa: { alignItems: "center", gap: tema.espaco.lg, paddingHorizontal: tema.espaco.xl },
  pulmoes: { flexDirection: "row", gap: tema.espaco.md },
  pulmao: {
    width: 54,
    height: 78,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "rgba(61, 220, 255, 0.45)",
    backgroundColor: "rgba(61, 220, 255, 0.06)",
  },
  vazio: {
    color: tema.cores.textoInverso,
    fontSize: tema.tipo.sm,
    textAlign: "center",
    lineHeight: 20,
  },
  accoes: {
    position: "absolute",
    left: tema.espaco.md,
    right: tema.espaco.md,
    bottom: tema.espaco.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tema.espaco.sm,
  },
  accao: {
    backgroundColor: "rgba(7, 20, 28, 0.72)",
    borderRadius: tema.raio.pill,
    borderWidth: tema.linhaBorda,
    borderColor: "rgba(61, 220, 255, 0.35)",
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.sm,
  },
  accaoActiva: {
    backgroundColor: tema.cores.primario,
    borderColor: tema.cores.ciano,
  },
  accaoInactiva: { opacity: tema.opacidadeDesactivado },
  accaoTexto: {
    color: tema.cores.textoInverso,
    fontSize: tema.tipo.xs,
    fontWeight: "700",
  },
});
