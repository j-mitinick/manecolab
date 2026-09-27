import { StyleSheet, Text, View } from "react-native";

import { tema } from "../theme/theme";

export function BannerIncerteza() {
  return (
    <View style={estilos.banner}>
      <Text style={estilos.titulo}>Incerteza do ensemble</Text>
      <Text style={estilos.texto}>Confiança do ensemble abaixo de 50 %. Correlacionar com clínica.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  banner: {
    backgroundColor: tema.cores.alertaFundo,
    borderColor: tema.cores.alerta,
    borderRadius: tema.raio.md,
    borderWidth: tema.linhaBorda,
    gap: tema.espaco.xs,
    padding: tema.espaco.lg,
  },
  titulo: { color: tema.cores.alerta, fontSize: tema.tipo.sm, fontWeight: "700" },
  texto: { color: tema.cores.texto, fontSize: tema.tipo.sm, lineHeight: 20 },
});
