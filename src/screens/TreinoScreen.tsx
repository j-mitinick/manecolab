import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { BotaoPrimario } from "../components/BotaoPrimario";
import { MolduraApp } from "../components/MolduraApp";
import { Vidro } from "../components/Vidro";
import { useAuth } from "../context/AuthContext";
import { alertarSeRede, listarFichasTreino, mensagemDeErro } from "../services/api";
import { tema } from "../theme/theme";
import type { ModeloTreino } from "../types/api";
import { podeVerTreino, ROTULO_CLASSE, rotuloCnn } from "../utils/rotulos";
import type { ClasseNome } from "../types/api";

export function TreinoScreen() {
  const { utilizador } = useAuth();
  const [fichas, setFichas] = useState<ModeloTreino[]>([]);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const autorizado = utilizador ? podeVerTreino(utilizador.funcao) : false;

  const carregar = useCallback(async () => {
    if (!autorizado) {
      setACarregar(false);
      return;
    }
    setACarregar(true);
    setErro(null);
    try {
      setFichas(await listarFichasTreino());
    } catch (falha) {
      alertarSeRede(falha);
      setErro(mensagemDeErro(falha));
    } finally {
      setACarregar(false);
    }
  }, [autorizado]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  return (
    <MolduraApp>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={estilos.titulo}>Ficha de treino</Text>
        {!autorizado ? (
          <Text style={estilos.lead}>Esta ficha está disponível para radiologista e administrador.</Text>
        ) : null}
        {aCarregar ? <ActivityIndicator color={tema.cores.primario} /> : null}
        {erro ? (
          <View style={estilos.bloco}>
            <Text style={estilos.erro}>{erro}</Text>
            <BotaoPrimario titulo="Tentar de novo" onPress={() => void carregar()} />
          </View>
        ) : null}
        {fichas[0] ? (
          <Vidro style={estilos.nota}>
            <Text style={estilos.notaTexto}>{fichas[0].notas_estudo}</Text>
            <Text style={estilos.notaTexto}>{fichas[0].protocolo_feedback}</Text>
          </Vidro>
        ) : null}
        {fichas.map((ficha) => (
          <Vidro key={ficha.nome} style={estilos.cartao}>
            <Text style={estilos.nome}>{rotuloCnn(ficha.nome)}</Text>
            <Text style={estilos.meta}>{ficha.carregado ? "Carregado" : "Não carregado"}</Text>
            <Text style={estilos.meta}>{ficha.ensemble_oficial ? "Ensemble oficial" : "Fora do ensemble oficial"}</Text>
            <Text style={estilos.meta}>Entrada: {ficha.entrada}</Text>
            <Text style={estilos.meta}>Semente {ficha.seed}</Text>
            <Text style={estilos.subtitulo}>Corpus aceite</Text>
            {Object.entries(ficha.corpus_feedback_aceite).map(([classe, n]) => (
              <Text key={classe} style={estilos.meta}>
                {ROTULO_CLASSE[classe as ClasseNome] ?? classe}: {n}
              </Text>
            ))}
          </Vidro>
        ))}
      </ScrollView>
    </MolduraApp>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: tema.espaco.lg, gap: tema.espaco.md },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
  nome: { color: tema.cores.texto, fontSize: tema.tipo.lg, fontWeight: "700" },
  subtitulo: { color: tema.cores.texto, fontSize: tema.tipo.sm, fontWeight: "700", marginTop: tema.espaco.xs },
  lead: { color: tema.cores.muted, fontSize: tema.tipo.sm, lineHeight: 20 },
  meta: { color: tema.cores.muted, fontSize: tema.tipo.sm },
  bloco: { gap: tema.espaco.sm },
  erro: { color: tema.cores.erro, fontSize: tema.tipo.sm },
  cartao: {
    borderRadius: tema.raio.lg,
    padding: tema.espaco.lg,
    gap: tema.espaco.xs,
  },
  nota: {
    borderRadius: tema.raio.sm,
    padding: tema.espaco.md,
    gap: tema.espaco.sm,
  },
  notaTexto: { color: tema.cores.texto, fontSize: tema.tipo.sm, lineHeight: 20 },
});
