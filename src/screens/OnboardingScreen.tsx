import { useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aparicao } from "../components/Aparicao";
import { BotaoPrimario } from "../components/BotaoPrimario";
import { FundoClinico } from "../components/FundoClinico";
import { Vidro } from "../components/Vidro";
import { useAuth } from "../context/AuthContext";
import { tema } from "../theme/theme";

const PAGINAS = [
  {
    kicker: "Triagem CAD",
    titulo: "Radiografia de tórax",
    texto:
      "O Maneco apoia a leitura de radiografias de tórax em quatro classes exclusivas: covid, pneumonia, tuberculose e normal. É uma classificação assistida, não um diagnóstico autónomo.",
  },
  {
    kicker: "Ensemble oficial",
    titulo: "Três redes e Grad-CAM",
    texto:
      "O resultado oficial é a média do ResNet50V2, DenseNet121 e EfficientNetB4. Os mapas Grad-CAM mostram a região que mais influenciou a classe prevista.",
  },
  {
    kicker: "Uso clínico",
    titulo: "A conta já existe",
    texto:
      "As contas são criadas pelo administrador da unidade. O resultado não substitui o clínico: correlacione sempre com a história e os restantes exames.",
  },
];

export function OnboardingScreen() {
  const { concluirOnboarding } = useAuth();
  const insets = useSafeAreaInsets();
  const [pagina, setPagina] = useState(0);
  const opacidade = useRef(new Animated.Value(1)).current;
  const actual = PAGINAS[pagina];
  const ultima = pagina === PAGINAS.length - 1;

  function irPara(indice: number) {
    Animated.timing(opacidade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setPagina(indice);
      Animated.timing(opacidade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    });
  }

  return (
    <FundoClinico>
      <View style={[estilos.ecra, { paddingTop: insets.top + tema.espaco.xl, paddingBottom: insets.bottom + tema.espaco.xl }]}>
        <Aparicao>
          <Text style={estilos.marca}>Maneco</Text>
          <Text style={estilos.subtitulo}>Leitura assistida de tórax</Text>
        </Aparicao>
        <Animated.View style={{ opacity: opacidade }}>
          <Vidro style={estilos.cartao} intensidade={62}>
            <View style={estilos.selo}>
              <Text style={estilos.seloTexto}>{String(pagina + 1).padStart(2, "0")}</Text>
            </View>
            <Text style={estilos.kicker}>{actual.kicker}</Text>
            <Text style={estilos.titulo}>{actual.titulo}</Text>
            <Text style={estilos.texto}>{actual.texto}</Text>
          </Vidro>
        </Animated.View>
        <View style={estilos.rodape}>
          <View style={estilos.pontos}>
            {PAGINAS.map((item, indice) => (
              <View key={item.kicker} style={[estilos.ponto, indice === pagina && estilos.pontoActivo]} />
            ))}
          </View>
          <BotaoPrimario
            titulo={ultima ? "Começar" : "Seguinte"}
            onPress={() => {
              if (ultima) {
                void concluirOnboarding();
                return;
              }
              irPara(pagina + 1);
            }}
          />
        </View>
      </View>
    </FundoClinico>
  );
}

const estilos = StyleSheet.create({
  ecra: {
    flex: 1,
    paddingHorizontal: tema.espaco.xl,
    justifyContent: "space-between",
  },
  marca: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
  subtitulo: { color: tema.cores.muted, fontSize: tema.tipo.md, marginTop: tema.espaco.xs },
  cartao: {
    borderRadius: tema.raio.lg,
    padding: tema.espaco.xl,
    gap: tema.espaco.md,
  },
  selo: {
    alignSelf: "flex-start",
    backgroundColor: "#E5F3FB",
    borderRadius: tema.raio.pill,
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.xs,
  },
  seloTexto: { color: tema.cores.primario, fontWeight: "700", fontSize: tema.tipo.sm },
  kicker: { color: tema.cores.teal, fontSize: tema.tipo.xs, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
  texto: { color: tema.cores.muted, fontSize: tema.tipo.md, lineHeight: 24 },
  rodape: { gap: tema.espaco.lg },
  pontos: { flexDirection: "row", gap: tema.espaco.sm, justifyContent: "center" },
  ponto: { width: 8, height: 8, borderRadius: tema.raio.pill, backgroundColor: tema.cores.linha },
  pontoActivo: { backgroundColor: tema.cores.primario, width: 22 },
});
