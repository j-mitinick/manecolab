import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { alertarSeRede, erroHttp, mensagemDeErro, submeterFeedback } from "../services/api";
import { tema } from "../theme/theme";
import type { ClasseNome, FeedbackPublico, FuncaoNome, NivelExperiencia } from "../types/api";
import { CLASSES, numeroPt, podeSubmeterFeedback, ROTULO_CLASSE, ROTULO_ESTADO } from "../utils/rotulos";
import { BotaoPrimario } from "./BotaoPrimario";
import { Vidro } from "./Vidro";

interface Props {
  funcao: FuncaoNome;
  nivel: NivelExperiencia;
  predicaoId: number | null;
  classeModelo: ClasseNome | null;
}

const MENSAGEM_SUCESSO =
  "Feedback enviado com sucesso. Obrigado por contribuir para a melhoria contínua do modelo. O parecer ficou pendente de revisão do administrador.";

export function ValidacaoMedica({ funcao, nivel, predicaoId, classeModelo }: Props) {
  const [comentario, setComentario] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [classeEscolhida, setClasseEscolhida] = useState<ClasseNome | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resposta, setResposta] = useState<FeedbackPublico | null>(null);
  const [toast, setToast] = useState(false);

  async function enviar(classe: ClasseNome) {
    if (predicaoId === null || enviado) {
      return;
    }
    setAEnviar(true);
    setErro(null);
    try {
      const fb = await submeterFeedback(predicaoId, {
        classe_proposta: classe,
        comentario: comentario.trim() ? comentario.trim() : null,
      });
      setResposta(fb);
      setEnviado(true);
      setToast(true);
      setModalAberto(false);
    } catch (falha) {
      alertarSeRede(falha);
      if (erroHttp(falha)?.response?.status === 409) {
        setEnviado(true);
      }
      setErro(mensagemDeErro(falha));
    } finally {
      setAEnviar(false);
    }
  }

  if (!podeSubmeterFeedback(funcao)) {
    return (
      <Vidro style={estilos.cartao}>
        <Text style={estilos.titulo}>Validação de rótulo</Text>
        <Text style={estilos.corpo}>A validação de rótulo para o corpus é feita pelo radiologista.</Text>
      </Vidro>
    );
  }

  if (predicaoId === null || classeModelo === null) {
    return (
      <Vidro style={estilos.cartao}>
        <Text style={estilos.titulo}>Validação de rótulo</Text>
        <Text style={estilos.corpo}>Classifique uma imagem para registar o parecer.</Text>
      </Vidro>
    );
  }

  return (
    <Vidro style={estilos.cartao}>
      <Text style={estilos.titulo}>Validação de rótulo</Text>
      <Text style={estilos.corpo}>
        Um único parecer por predição. A classe proposta não actualiza o modelo: fica pendente de revisão do administrador.
      </Text>
      {nivel === "junior" ? (
        <Text style={estilos.avisoJunior}>O seu parecer fica pendente de revisão e pesa 0,25 no corpus.</Text>
      ) : null}
      <Text style={estilos.etiqueta}>Comentário (opcional)</Text>
      <TextInput
        value={comentario}
        onChangeText={setComentario}
        editable={!enviado && !aEnviar}
        multiline
        maxLength={2000}
        placeholder="Observação clínica, sem identificadores do paciente"
        placeholderTextColor={tema.cores.muted}
        style={estilos.campo}
      />
      <View style={estilos.accoes}>
        <BotaoPrimario
          titulo="Confirmar classificação da IA"
          onPress={() => void enviar(classeModelo)}
          disabled={enviado}
          aCarregar={aEnviar && !modalAberto}
        />
        <BotaoPrimario
          titulo="Corrigir classificação"
          variante="teal"
          onPress={() => {
            setClasseEscolhida(null);
            setModalAberto(true);
          }}
          disabled={enviado || aEnviar}
        />
      </View>
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
      {resposta ? (
        <View style={estilos.resultado}>
          <Text style={estilos.corpo}>Estado: {ROTULO_ESTADO[resposta.estado]}</Text>
          <Text style={estilos.corpo}>
            Classe proposta: {ROTULO_CLASSE[resposta.classe_proposta]} · Peso {numeroPt(resposta.peso)}
          </Text>
          {resposta.aviso_proteccao ? <Text style={estilos.avisoJunior}>{resposta.aviso_proteccao}</Text> : null}
        </View>
      ) : null}
      {toast ? (
        <View style={estilos.toast}>
          <Text style={estilos.toastTexto}>{MENSAGEM_SUCESSO}</Text>
          <Pressable onPress={() => setToast(false)} accessibilityRole="button">
            <Text style={estilos.fechar}>Fechar</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal visible={modalAberto} transparent animationType="fade" onRequestClose={() => setModalAberto(false)}>
        <View style={estilos.modalFundo}>
          <Vidro isolado style={estilos.modalCartao} intensidade={70}>
            <Text style={estilos.titulo}>Corrigir classificação</Text>
            <Text style={estilos.corpo}>Escolha uma única classe. Se coincidir com a IA, o envio conta como confirmação.</Text>
            {CLASSES.map((classe) => {
              const activa = classeEscolhida === classe;
              return (
                <Pressable
                  key={classe}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activa }}
                  onPress={() => setClasseEscolhida(classe)}
                  style={estilos.radioLinha}
                >
                  <View style={[estilos.radio, activa && estilos.radioActivo]} />
                  <Text style={estilos.radioTexto}>
                    {ROTULO_CLASSE[classe]}
                    {classe === classeModelo ? " (classe da IA)" : ""}
                  </Text>
                </Pressable>
              );
            })}
            {classeEscolhida === classeModelo ? (
              <Text style={estilos.avisoJunior}>Esta classe coincide com a da IA; o envio conta como confirmação.</Text>
            ) : null}
            <BotaoPrimario
              titulo="Enviar correção"
              onPress={() => {
                if (classeEscolhida) {
                  void enviar(classeEscolhida);
                }
              }}
              disabled={!classeEscolhida}
              aCarregar={aEnviar}
            />
            <BotaoPrimario titulo="Cancelar" variante="contorno" onPress={() => setModalAberto(false)} disabled={aEnviar} />
          </Vidro>
        </View>
      </Modal>
    </Vidro>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    borderRadius: tema.raio.lg,
    padding: tema.espaco.lg,
    gap: tema.espaco.md,
  },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.lg, fontWeight: "700" },
  corpo: { color: tema.cores.muted, fontSize: tema.tipo.sm, lineHeight: 20 },
  avisoJunior: { color: tema.cores.alerta, fontSize: tema.tipo.sm, lineHeight: 20 },
  etiqueta: { color: tema.cores.texto, fontSize: tema.tipo.sm, fontWeight: "600" },
  campo: {
    minHeight: 88,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
    borderRadius: tema.raio.sm,
    padding: tema.espaco.md,
    color: tema.cores.texto,
    fontSize: tema.tipo.md,
    textAlignVertical: "top",
    backgroundColor: tema.cores.fundo,
  },
  accoes: { gap: tema.espaco.sm },
  erro: { color: tema.cores.erro, fontSize: tema.tipo.sm },
  resultado: { gap: tema.espaco.xs },
  toast: {
    backgroundColor: tema.cores.sucessoFundo,
    borderRadius: tema.raio.sm,
    padding: tema.espaco.md,
    gap: tema.espaco.sm,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.sucesso,
  },
  toastTexto: { color: tema.cores.texto, fontSize: tema.tipo.sm, lineHeight: 20 },
  fechar: { color: tema.cores.sucesso, fontSize: tema.tipo.sm, fontWeight: "700" },
  modalFundo: {
    flex: 1,
    backgroundColor: tema.cores.overlay,
    justifyContent: "center",
    padding: tema.espaco.lg,
  },
  modalCartao: {
    borderRadius: tema.raio.lg,
    padding: tema.espaco.lg,
    gap: tema.espaco.md,
  },
  radioLinha: { flexDirection: "row", alignItems: "center", gap: tema.espaco.md },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: tema.cores.muted,
  },
  radioActivo: { borderColor: tema.cores.primario, backgroundColor: tema.cores.primario },
  radioTexto: { color: tema.cores.texto, fontSize: tema.tipo.md, flex: 1 },
});
