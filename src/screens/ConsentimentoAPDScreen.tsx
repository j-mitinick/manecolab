import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BotaoPrimario } from "../components/BotaoPrimario";
import { FundoClinico } from "../components/FundoClinico";
import { Vidro } from "../components/Vidro";
import { useAuth } from "../context/AuthContext";
import { tema } from "../theme/theme";

export function ConsentimentoAPDScreen() {
  const { aceitarApd, sair } = useAuth();
  const insets = useSafeAreaInsets();
  const [marcado, setMarcado] = useState(false);

  return (
    <FundoClinico>
    <View style={[estilos.ecra, { paddingTop: insets.top + tema.espaco.lg, paddingBottom: insets.bottom + tema.espaco.lg }]}>
      <ScrollView style={estilos.scroll} contentContainerStyle={estilos.scrollConteudo} showsVerticalScrollIndicator={false}>
        <Vidro style={estilos.conteudo} intensidade={62}>
        <Text style={estilos.kicker}>Proteção de dados</Text>
        <Text style={estilos.titulo}>Termo de consentimento</Text>
        <Text style={estilos.paragrafo}>
          Este termo rege o tratamento de dados pessoais no Maneco, nos termos da Lei da Proteção de Dados Pessoais de Angola
          (Lei n.º 22/11) e das diretrizes da APD (Agência de Proteção de Dados).
        </Text>
        <Text style={estilos.paragrafo}>
          A finalidade é a triagem assistida de imagem de radiografia de tórax. O resultado não constitui diagnóstico autónomo
          e não substitui o julgamento do clínico.
        </Text>
        <Text style={estilos.paragrafo}>
          A unidade observa confidencialidade e minimização dos dados. Sempre que possível, aplica anonimização ou
          pseudonimização dos dados clínicos.
        </Text>
        <Text style={estilos.paragrafo}>
          A imagem e o parecer ficam no servidor da unidade para auditoria e para o corpus de re-treino offline, revisto por
          um administrador. A aplicação não actualiza o modelo no momento do parecer.
        </Text>
        <Text style={estilos.paragrafo}>
          O utilizador é responsável por não fotografar identificadores do paciente no ficheiro enviado.
        </Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: marcado }}
          onPress={() => setMarcado((valor) => !valor)}
          style={estilos.checkLinha}
        >
          <View style={[estilos.caixa, marcado && estilos.caixaOn]}>
            {marcado ? <Text style={estilos.visto}>✓</Text> : null}
          </View>
          <Text style={estilos.checkTexto}>
            Li e aceito o tratamento de dados nos termos da Lei n.º 22/11 e da APD.
          </Text>
        </Pressable>
        </Vidro>
      </ScrollView>
      <View style={estilos.accoes}>
        <BotaoPrimario titulo="Aceitar e Continuar" onPress={() => void aceitarApd()} disabled={!marcado} />
        <BotaoPrimario titulo="Recusar e sair" variante="contorno" onPress={() => void sair()} />
      </View>
    </View>
    </FundoClinico>
  );
}

const estilos = StyleSheet.create({
  ecra: { flex: 1, paddingHorizontal: tema.espaco.lg },
  scroll: { flex: 1 },
  scrollConteudo: { paddingBottom: tema.espaco.lg },
  conteudo: {
    gap: tema.espaco.md,
    borderRadius: tema.raio.lg,
    padding: tema.espaco.xl,
  },
  kicker: { color: tema.cores.teal, fontSize: tema.tipo.xs, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
  paragrafo: { color: tema.cores.muted, fontSize: tema.tipo.md, lineHeight: 24 },
  checkLinha: { flexDirection: "row", gap: tema.espaco.md, alignItems: "flex-start", marginTop: tema.espaco.sm },
  caixa: {
    width: 22,
    height: 22,
    borderRadius: tema.espaco.xs,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.muted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: tema.espaco.xs,
  },
  caixaOn: { backgroundColor: tema.cores.primario, borderColor: tema.cores.primario },
  visto: { color: tema.cores.branco, fontSize: tema.tipo.sm, fontWeight: "700" },
  checkTexto: { flex: 1, color: tema.cores.texto, fontSize: tema.tipo.sm, lineHeight: 20 },
  accoes: { gap: tema.espaco.sm },
});
