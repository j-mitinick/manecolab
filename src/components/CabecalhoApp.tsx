import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { tema } from "../theme/theme";
import { BadgeFuncao } from "./BadgeFuncao";
import { Vidro } from "./Vidro";

export function CabecalhoApp() {
  const { utilizador, sair } = useAuth();
  const insets = useSafeAreaInsets();
  const nome = utilizador ? `${utilizador.primeiro_nome} ${utilizador.ultimo_nome}` : "";
  const iniciais = utilizador
    ? `${utilizador.primeiro_nome.charAt(0)}${utilizador.ultimo_nome.charAt(0)}`.toUpperCase()
    : "M";

  return (
    <View style={[estilos.barra, { paddingTop: insets.top + tema.espaco.sm }]}>
      <Vidro style={estilos.vidro} intensidade={64}>
        <View style={estilos.marca}>
          <Text style={estilos.marcaTexto}>{iniciais}</Text>
        </View>
        <View style={estilos.nomes}>
          <Text style={estilos.kicker}>ManecoLab</Text>
          <Text style={estilos.nome} numberOfLines={1}>
            {nome}
          </Text>
          {utilizador ? <BadgeFuncao funcao={utilizador.funcao} /> : null}
        </View>
        <Pressable accessibilityRole="button" onPress={() => void sair()} style={estilos.sair}>
          <Text style={estilos.sairTexto}>Sair</Text>
        </Pressable>
      </Vidro>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    paddingHorizontal: tema.espaco.lg,
    paddingBottom: tema.espaco.md,
  },
  vidro: {
    flexDirection: "row",
    alignItems: "center",
    gap: tema.espaco.md,
    borderRadius: tema.raio.lg,
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.sm,
  },
  marca: {
    width: 46,
    height: 46,
    borderRadius: tema.raio.pill,
    backgroundColor: tema.cores.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  marcaTexto: { color: tema.cores.branco, fontWeight: "700", fontSize: tema.tipo.sm },
  nomes: { flex: 1, gap: tema.espaco.xs },
  kicker: {
    color: tema.cores.teal,
    fontSize: tema.tipo.xs,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  nome: { color: tema.cores.texto, fontSize: tema.tipo.md, fontWeight: "700" },
  sair: {
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRadius: tema.raio.pill,
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.sm,
    borderWidth: tema.linhaBorda,
    borderColor: "rgba(255,255,255,0.85)",
  },
  sairTexto: { color: tema.cores.primario, fontSize: tema.tipo.sm, fontWeight: "700" },
});
