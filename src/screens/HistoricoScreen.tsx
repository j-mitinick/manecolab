import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { BotaoPrimario } from "../components/BotaoPrimario";
import { MolduraApp } from "../components/MolduraApp";
import { Vidro } from "../components/Vidro";
import { alertarSeRede, listarPredicoes, mensagemDeErro, obterImagemPredicao } from "../services/api";
import { tema } from "../theme/theme";
import type { PredicaoResumo } from "../types/api";
import { formatarData, percentagem, ROTULO_CLASSE } from "../utils/rotulos";

export function HistoricoScreen() {
  const [linhas, setLinhas] = useState<PredicaoResumo[]>([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [imagemAberta, setImagemAberta] = useState(false);
  const [imagemUri, setImagemUri] = useState<string | null>(null);
  const [imagemACarregar, setImagemACarregar] = useState(false);
  const [imagemErro, setImagemErro] = useState(false);
  const pedidoImagem = useRef(0);

  async function abrirImagem(id: number) {
    const pedido = pedidoImagem.current + 1;
    pedidoImagem.current = pedido;
    setImagemAberta(true);
    setImagemUri(null);
    setImagemErro(false);
    setImagemACarregar(true);
    try {
      const uri = await obterImagemPredicao(id);
      if (pedidoImagem.current === pedido) {
        setImagemUri(uri);
      }
    } catch (falha) {
      alertarSeRede(falha);
      if (pedidoImagem.current === pedido) {
        setImagemErro(true);
      }
    } finally {
      if (pedidoImagem.current === pedido) {
        setImagemACarregar(false);
      }
    }
  }

  const carregar = useCallback(async () => {
    setACarregar(true);
    setErro(null);
    try {
      const dados = await listarPredicoes();
      setLinhas(dados);
    } catch (falha) {
      alertarSeRede(falha);
      setErro(mensagemDeErro(falha));
    } finally {
      setACarregar(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  return (
    <MolduraApp>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={estilos.titulo}>Histórico</Text>
        <Text style={estilos.lead}>Classificações guardadas nesta conta. Não é um diagnóstico.</Text>
        {aCarregar ? <ActivityIndicator color={tema.cores.primario} /> : null}
        {erro ? (
          <View style={estilos.bloco}>
            <Text style={estilos.erro}>{erro}</Text>
            <BotaoPrimario titulo="Tentar de novo" onPress={() => void carregar()} />
          </View>
        ) : null}
        {!aCarregar && !erro && linhas.length === 0 ? (
          <Text style={estilos.lead}>Ainda não há classificações nesta conta.</Text>
        ) : null}
        {linhas.map((linha) => (
          <Vidro key={linha.id} style={[estilos.cartao, linha.alerta_incerteza && estilos.cartaoIncerto]}>
            <Text style={estilos.classe}>{ROTULO_CLASSE[linha.classe_predita]}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void abrirImagem(linha.id)}
              style={estilos.verImagem}
            >
              <Text style={estilos.verImagemTexto}>Ver imagem</Text>
            </Pressable>
            <Text style={estilos.meta}>
              Confiança {percentagem(linha.confianca)}
              {linha.alerta_incerteza ? " · abaixo de 50 %" : ""}
            </Text>
            <Text style={estilos.meta}>
              {formatarData(linha.criado_em)} · {linha.autor_nome} · {linha.n_feedbacks} pareceres
            </Text>
          </Vidro>
        ))}
      </ScrollView>
      <Modal visible={imagemAberta} transparent animationType="fade" onRequestClose={() => setImagemAberta(false)}>
        <View style={estilos.modalFundo}>
          <View style={estilos.modalCartao}>
            {imagemUri ? (
              <Image accessibilityLabel="Radiografia de tórax" source={{ uri: imagemUri }} style={estilos.modalImagem} resizeMode="contain" />
            ) : (
              <View style={estilos.modalImagem} />
            )}
            {imagemACarregar ? <ActivityIndicator color={tema.cores.ciano} style={estilos.modalLoader} /> : null}
            {imagemErro ? <Text style={estilos.modalErro}>Não foi possível abrir a imagem.</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => setImagemAberta(false)} style={estilos.fechar}>
              <Text style={estilos.fecharTexto}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </MolduraApp>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: tema.espaco.lg, gap: tema.espaco.md },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
  lead: { color: tema.cores.muted, fontSize: tema.tipo.sm, lineHeight: 20 },
  bloco: { gap: tema.espaco.sm },
  erro: { color: tema.cores.erro, fontSize: tema.tipo.sm },
  cartao: {
    borderRadius: tema.raio.md,
    padding: tema.espaco.lg,
    gap: tema.espaco.xs,
  },
  cartaoIncerto: { borderColor: tema.cores.alerta },
  classe: { color: tema.cores.texto, fontSize: tema.tipo.lg, fontWeight: "700" },
  meta: { color: tema.cores.muted, fontSize: tema.tipo.sm },
  verImagem: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: tema.raio.pill,
    borderWidth: tema.linhaBorda,
    borderColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.xs,
  },
  verImagemTexto: { color: tema.cores.primario, fontSize: tema.tipo.sm, fontWeight: "700" },
  modalFundo: {
    flex: 1,
    backgroundColor: tema.cores.overlay,
    justifyContent: "center",
    padding: tema.espaco.lg,
  },
  modalCartao: {
    backgroundColor: tema.cores.visualizador,
    borderRadius: tema.raio.lg,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.visualizadorBorda,
    overflow: "hidden",
    minHeight: 320,
    justifyContent: "flex-end",
  },
  modalImagem: { width: "100%", height: 420 },
  modalLoader: { position: "absolute", top: "45%", alignSelf: "center" },
  modalErro: {
    color: tema.cores.textoInverso,
    fontSize: tema.tipo.sm,
    textAlign: "center",
    paddingHorizontal: tema.espaco.lg,
    paddingBottom: tema.espaco.md,
  },
  fechar: {
    alignSelf: "center",
    marginBottom: tema.espaco.lg,
    paddingHorizontal: tema.espaco.lg,
    paddingVertical: tema.espaco.sm,
    borderRadius: tema.raio.pill,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.ciano,
  },
  fecharTexto: { color: tema.cores.ciano, fontSize: tema.tipo.sm, fontWeight: "700" },
});
