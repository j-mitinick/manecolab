import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";

import { BannerIncerteza } from "../components/BannerIncerteza";
import { BarraProbabilidade } from "../components/BarraProbabilidade";
import { BotaoPrimario } from "../components/BotaoPrimario";
import { MolduraApp } from "../components/MolduraApp";
import { ValidacaoMedica } from "../components/ValidacaoMedica";
import { VisualizadorCXR } from "../components/VisualizadorCXR";
import { useAuth } from "../context/AuthContext";
import { useLayoutClinico } from "../hooks/useLayoutClinico";
import { alertarSeRede, classificarImagem, mensagemDeErro } from "../services/api";
import { Pulso } from "../components/Pulso";
import { Vidro } from "../components/Vidro";
import { tema } from "../theme/theme";
import type { ClasseNome, FicheiroImagem, PredictResposta, SoftmaxClasses } from "../types/api";
import { CLASSES, classeMaisProvavel, MODELO_XAI_PADRAO, MODELOS_XAI, percentagem, ROTULO_CLASSE, rotuloCnn } from "../utils/rotulos";

function notaClinicaVisivel(texto: string): string {
  return texto.replace(/\s*\(softmax,\s*4 classes exclusivas\)/gi, "").replace(/\s{2,}/g, " ").trim();
}

interface ImagemLocal {
  uri: string;
  ficheiro: FicheiroImagem;
}

function ModelosIndividuais({
  probabilidades,
  activo,
  onMudar,
}: {
  probabilidades: Record<string, SoftmaxClasses>;
  activo: string | null;
  onMudar: (nome: string) => void;
}) {
  const nomes = Object.keys(probabilidades);
  const seleccionado = activo && nomes.includes(activo) ? activo : nomes[0];
  if (!seleccionado) {
    return null;
  }
  const probs = probabilidades[seleccionado];
  const topo = classeMaisProvavel(probs);
  return (
    <View style={estilos.bloco}>
      <View style={estilos.abas} accessibilityRole="tablist">
        {nomes.map((nome) => {
          const ligada = nome === seleccionado;
          return (
            <Pressable
              key={nome}
              accessibilityRole="tab"
              accessibilityState={{ selected: ligada }}
              onPress={() => onMudar(nome)}
              style={[estilos.aba, ligada && estilos.abaActiva]}
            >
              <Text style={[estilos.abaTexto, ligada && estilos.abaTextoActivo]}>{rotuloCnn(nome)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Vidro style={estilos.cartao}>
        <Text style={estilos.kicker}>Modelo</Text>
        <Text style={estilos.subtituloModelo}>{rotuloCnn(seleccionado)}</Text>
        <Text style={estilos.meta}>Classe mais provável: {ROTULO_CLASSE[topo]}</Text>
        {CLASSES.map((classe) => (
          <BarraProbabilidade
            key={`${seleccionado}-${classe}`}
            rotulo={ROTULO_CLASSE[classe]}
            probabilidade={probs[classe]}
            destacada={classe === topo}
          />
        ))}
      </Vidro>
    </View>
  );
}

function paraFicheiro(asset: ImagePickerAsset): FicheiroImagem | null {
  const mime = (asset.mimeType ?? "").toLowerCase();
  const uri = asset.uri.toLowerCase();
  const png = mime === "image/png" || uri.endsWith(".png");
  const jpeg = mime === "image/jpeg" || mime === "image/jpg" || uri.endsWith(".jpg") || uri.endsWith(".jpeg");
  if (mime.startsWith("image/") && !png && !jpeg) {
    return null;
  }
  const type = png ? "image/png" : "image/jpeg";
  const ext = png ? "png" : "jpg";
  const nome = asset.fileName && /\.(png|jpe?g)$/i.test(asset.fileName) ? asset.fileName : `cxr.${ext}`;
  return { uri: asset.uri, name: nome, type };
}

export function DiagnosticoScreen() {
  const { utilizador, autenticado, apdAceite } = useAuth();
  const { tablet } = useLayoutClinico();
  const [imagem, setImagem] = useState<ImagemLocal | null>(null);
  const [incluirXai, setIncluirXai] = useState(false);
  const [modeloXai, setModeloXai] = useState<string>(MODELO_XAI_PADRAO);
  const [aInferir, setAInferir] = useState(false);
  const [resultado, setResultado] = useState<PredictResposta | null>(null);
  const [classeXai, setClasseXai] = useState<ClasseNome | null>(null);
  const [modeloActivo, setModeloActivo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const sessaoOk = autenticado && apdAceite && Boolean(utilizador) && !utilizador?.bloqueado;
  const podeClassificar = sessaoOk && imagem !== null && !aInferir;

  const uriVista = useMemo(() => {
    if (classeXai && resultado?.visualizacao_xai[classeXai]) {
      return resultado.visualizacao_xai[classeXai] ?? null;
    }
    return imagem?.uri ?? null;
  }, [classeXai, resultado, imagem]);

  const altura = tablet ? tema.alturaVisualizadorTablet : tema.alturaVisualizador;
  const classeMapa = resultado
    ? resultado.visualizacao_xai[resultado.ensemble_oficial.classe_predita]
      ? resultado.ensemble_oficial.classe_predita
      : ((Object.keys(resultado.visualizacao_xai)[0] as ClasseNome | undefined) ?? null)
    : null;

  function aplicarAsset(asset: ImagePickerAsset) {
    const ficheiro = paraFicheiro(asset);
    if (!ficheiro) {
      Alert.alert("Formato", "Envie apenas JPEG ou PNG. A API não recebe outro formato neste fluxo.");
      return;
    }
    setImagem({ uri: asset.uri, ficheiro });
    setResultado(null);
    setClasseXai(null);
    setModeloActivo(null);
    setErro(null);
  }

  async function escolherGaleria() {
    if (!sessaoOk) {
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão", "Autorize o acesso à galeria para escolher a radiografia.");
      return;
    }
    const escolhido = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      exif: false,
      legacy: Platform.OS === "android",
    });
    if (!escolhido.canceled && escolhido.assets[0]) {
      aplicarAsset(escolhido.assets[0]);
    }
  }

  async function escolherCamara() {
    if (!sessaoOk) {
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão", "Autorize a câmara para fotografar a radiografia.");
      return;
    }
    const escolhido = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      exif: false,
    });
    if (!escolhido.canceled && escolhido.assets[0]) {
      aplicarAsset(escolhido.assets[0]);
    }
  }

  async function classificar() {
    if (!imagem || !podeClassificar) {
      return;
    }
    setAInferir(true);
    setErro(null);
    try {
      const resposta = await classificarImagem(imagem.ficheiro, incluirXai, incluirXai ? modeloXai : undefined);
      setResultado(resposta);
      const chaves = Object.keys(resposta.visualizacao_xai) as ClasseNome[];
      const preferida = chaves.includes(resposta.ensemble_oficial.classe_predita)
        ? resposta.ensemble_oficial.classe_predita
        : (chaves[0] ?? null);
      setClasseXai(preferida);
      setModeloActivo(Object.keys(resposta.probabilidades_individuais)[0] ?? null);
    } catch (falha) {
      alertarSeRede(falha);
      setErro(mensagemDeErro(falha, "predict"));
    } finally {
      setAInferir(false);
    }
  }

  const controlos = (
    <Vidro style={estilos.controlos}>
      {!apdAceite ? <Text style={estilos.aviso}>Aceite o termo da APD para classificar imagens.</Text> : null}
      {utilizador?.bloqueado ? <Text style={estilos.aviso}>Conta bloqueada.</Text> : null}
      <View style={estilos.filaBotoes}>
        <View style={estilos.botaoFlex}>
          <BotaoPrimario titulo="Galeria" variante="teal" onPress={() => void escolherGaleria()} disabled={!sessaoOk || aInferir} />
        </View>
        <View style={estilos.botaoFlex}>
          <BotaoPrimario titulo="Câmara" variante="contorno" onPress={() => void escolherCamara()} disabled={!sessaoOk || aInferir} />
        </View>
      </View>
      <View style={estilos.switchLinha}>
        <Text style={[estilos.switchTexto, estilos.switchEtiqueta]}>Incluir explicabilidade (Grad-CAM)</Text>
        <View style={estilos.switchControlo}>
          <Switch
            value={incluirXai}
            onValueChange={setIncluirXai}
            disabled={!sessaoOk || aInferir}
            trackColor={{ false: tema.cores.linha, true: tema.cores.primario }}
            thumbColor={tema.cores.branco}
          />
        </View>
      </View>
      {incluirXai ? (
        <View style={estilos.bloco}>
          <Text style={estilos.switchTexto}>Modelo do Grad-CAM</Text>
          <View style={estilos.abas}>
            {MODELOS_XAI.map((nome) => {
              const ligado = nome === modeloXai;
              return (
                <Pressable
                  key={nome}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ligado }}
                  disabled={!sessaoOk || aInferir}
                  onPress={() => setModeloXai(nome)}
                  style={[estilos.aba, ligado && estilos.abaActiva]}
                >
                  <Text style={[estilos.abaTexto, ligado && estilos.abaTextoActivo]}>{rotuloCnn(nome)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </Vidro>
  );

  const botaoClassificar = (
    <View style={estilos.classificar}>
      <BotaoPrimario titulo="Classificar" onPress={() => void classificar()} disabled={!podeClassificar} aCarregar={aInferir} />
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
    </View>
  );

  const visualizador = (
    <VisualizadorCXR
      uri={uriVista}
      altura={altura}
      accoes={
        imagem && resultado
          ? [
              {
                titulo: "Grad-CAM",
                activo: classeXai !== null,
                disabled: !classeMapa,
                onPress: () => {
                  if (classeMapa) {
                    setClasseXai(classeMapa);
                  }
                },
              },
              {
                titulo: "Ver raio-X original",
                activo: classeXai === null,
                onPress: () => setClasseXai(null),
              },
            ]
          : undefined
      }
    />
  );

  const ensemble = resultado ? (
    <View style={estilos.bloco}>
      {resultado.alerta_incerteza ? <BannerIncerteza /> : null}
      <Vidro style={estilos.cartao}>
        <Text style={estilos.kicker}>Resultado do Ensemble</Text>
        <Text style={estilos.classe}>{ROTULO_CLASSE[resultado.ensemble_oficial.classe_predita]}</Text>
        <Text style={estilos.confianca}>Confiança {percentagem(resultado.ensemble_oficial.confianca)}</Text>
        <Text style={estilos.meta}>{resultado.ensemble_oficial.componentes.map(rotuloCnn).join(" · ")}</Text>
        {CLASSES.map((classe) => (
          <BarraProbabilidade
            key={classe}
            rotulo={ROTULO_CLASSE[classe]}
            probabilidade={resultado.ensemble_oficial.probabilidades[classe]}
            destacada={classe === resultado.ensemble_oficial.classe_predita}
            incerta={resultado.alerta_incerteza}
          />
        ))}
      </Vidro>
      <View style={estilos.notaAviso}>
        <Text style={estilos.notaTexto}>{notaClinicaVisivel(resultado.nota_clinica)}</Text>
      </View>
    </View>
  ) : null;

  const modelos = resultado ? (
    <View style={estilos.bloco}>
      {resultado.nota_limiares ? (
        <View style={estilos.nota}>
          <Text style={estilos.notaTexto}>{resultado.nota_limiares}</Text>
        </View>
      ) : null}
      <ModelosIndividuais
        probabilidades={resultado.probabilidades_individuais}
        activo={modeloActivo}
        onMudar={setModeloActivo}
      />
    </View>
  ) : null;

  const validacao = resultado && utilizador ? (
    <ValidacaoMedica
      key={resultado.predicao_id}
      funcao={utilizador.funcao}
      nivel={utilizador.nivel_experiencia}
      predicaoId={resultado.predicao_id}
      classeModelo={resultado.ensemble_oficial.classe_predita}
    />
  ) : null;

  return (
    <MolduraApp>
      {tablet ? (
        <ScrollView contentContainerStyle={estilos.padding} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {controlos}
          <View style={estilos.lado}>
            <View style={estilos.colunaLado}>
              {visualizador}
              {botaoClassificar}
            </View>
            <View style={estilos.colunaLado}>{ensemble}</View>
          </View>
          {modelos}
          {validacao}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={estilos.padding} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {controlos}
          {visualizador}
          {botaoClassificar}
          {ensemble}
          {modelos}
          {validacao}
        </ScrollView>
      )}
      {aInferir ? (
        <View style={[StyleSheet.absoluteFill, estilos.bloqueio]} pointerEvents="auto">
          <Pulso />
          <Text style={estilos.bloqueioTexto}>A inferir o ensemble… pode demorar</Text>
        </View>
      ) : null}
    </MolduraApp>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  lado: { flexDirection: "row", gap: tema.espaco.lg, alignItems: "flex-start" },
  colunaLado: { flex: 1, gap: tema.espaco.lg },
  padding: { padding: tema.espaco.lg, gap: tema.espaco.lg },
  bloco: { gap: tema.espaco.md },
  controlos: {
    gap: tema.espaco.md,
    borderRadius: tema.raio.lg,
    padding: tema.espaco.lg,
  },
  filaBotoes: { flexDirection: "row", gap: tema.espaco.sm },
  botaoFlex: { flex: 1 },
  switchLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: tema.espaco.md,
  },
  switchTexto: { color: tema.cores.texto, fontSize: tema.tipo.md },
  switchEtiqueta: { flex: 1, minWidth: 0 },
  switchControlo: { flexShrink: 0 },
  classificar: { gap: tema.espaco.sm },
  aviso: { color: tema.cores.alerta, fontSize: tema.tipo.sm },
  erro: { color: tema.cores.erro, fontSize: tema.tipo.sm },
  cartao: {
    borderRadius: tema.raio.lg,
    padding: tema.espaco.lg,
    gap: tema.espaco.sm,
  },
  kicker: { color: tema.cores.teal, fontSize: tema.tipo.xs, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" },
  classe: { color: tema.cores.primario, fontSize: tema.tipo.xl, fontWeight: "700" },
  confianca: { color: tema.cores.texto, fontSize: tema.tipo.md },
  meta: { color: tema.cores.muted, fontSize: tema.tipo.sm, lineHeight: 20 },
  subtituloModelo: { color: tema.cores.texto, fontSize: tema.tipo.lg, fontWeight: "700" },
  nota: {
    backgroundColor: tema.cores.superficieAlta,
    borderRadius: tema.raio.sm,
    padding: tema.espaco.md,
    borderLeftWidth: tema.espaco.xs,
    borderLeftColor: tema.cores.primario,
  },
  notaAviso: {
    backgroundColor: tema.cores.alertaFundo,
    borderRadius: tema.raio.sm,
    padding: tema.espaco.md,
    borderLeftWidth: tema.espaco.xs,
    borderLeftColor: tema.cores.alerta,
  },
  notaTexto: { color: tema.cores.texto, fontSize: tema.tipo.sm, lineHeight: 20 },
  abas: { flexDirection: "row", flexWrap: "wrap", gap: tema.espaco.sm },
  aba: {
    borderRadius: tema.raio.pill,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.sm,
    backgroundColor: tema.cores.superficieAlta,
  },
  abaActiva: { backgroundColor: tema.cores.primario, borderColor: tema.cores.primario },
  abaTexto: { color: tema.cores.muted, fontSize: tema.tipo.sm, fontWeight: "700" },
  abaTextoActivo: { color: tema.cores.branco },
  bloqueio: {
    backgroundColor: tema.cores.overlay,
    alignItems: "center",
    justifyContent: "center",
    gap: tema.espaco.lg,
    padding: tema.espaco.xl,
  },
  bloqueioTexto: { color: tema.cores.textoInverso, fontSize: tema.tipo.md, textAlign: "center", fontWeight: "600" },
});
