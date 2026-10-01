import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { submeterFeedback } from "../services/api";
import { sombraFlutuante, tema } from "../theme/theme";
import type { ClasseNome, FuncaoNome, NivelExperiencia } from "../types/api";
import { CLASSES, podeSubmeterFeedback, ROTULO_CLASSE } from "../utils/rotulos";
import { FaixaToast, ToastAviso } from "./ToastAviso";

interface Props {
  funcao: FuncaoNome;
  nivel: NivelExperiencia;
  predicaoId: number | null;
  classeModelo: ClasseNome | null;
}

type TipoParecer = "positivo" | "negativo";

const TEXTO_RELATORIO = "Ao enviar este relatório, estará a contribuir para futuras melhorias nos nossos modelos.";
const TOAST_SUCESSO = "Feedback enviado";
const TOAST_ERRO = "Erro ao enviar o feedback tente novamente.";

export function ValidacaoMedica({ funcao, predicaoId, classeModelo }: Props) {
  const insets = useSafeAreaInsets();
  const [comentario, setComentario] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoParecer>("positivo");
  const [classeEscolhida, setClasseEscolhida] = useState<ClasseNome | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [toast, setToast] = useState<{ texto: string; sucesso: boolean } | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const temporizador = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(temporizador);
  }, [toast]);

  function abrir(parecer: TipoParecer) {
    setTipo(parecer);
    setComentario("");
    setClasseEscolhida(parecer === "positivo" ? classeModelo : null);
    setModalAberto(true);
  }

  async function enviar() {
    if (predicaoId === null || enviado || classeEscolhida === null) {
      return;
    }
    setAEnviar(true);
    try {
      await submeterFeedback(predicaoId, {
        classe_proposta: classeEscolhida,
        comentario: comentario.trim() ? comentario.trim() : null,
      });
      setEnviado(true);
      setModalAberto(false);
      setToast({ texto: TOAST_SUCESSO, sucesso: true });
    } catch {
      setToast({ texto: TOAST_ERRO, sucesso: false });
    } finally {
      setAEnviar(false);
    }
  }

  const positivo = tipo === "positivo";

  if (!podeSubmeterFeedback(funcao) || predicaoId === null || classeModelo === null || enviado) {
    return (
      <ToastAviso
        texto={toast?.texto ?? ""}
        sucesso={toast?.sucesso ?? false}
        visivel={toast !== null}
        onFechar={() => setToast(null)}
      />
    );
  }

  return (
    <>
      <View style={estilos.accoes}>
        <Pressable accessibilityRole="button" onPress={() => abrir("positivo")} style={[estilos.parecer, estilos.parecerBom]}>
          <Ionicons name="thumbs-up-outline" size={22} color={tema.cores.branco} />
          <Text style={estilos.parecerTexto}>Boa resposta</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => abrir("negativo")} style={[estilos.parecer, estilos.parecerRuim]}>
          <Ionicons name="thumbs-down-outline" size={22} color={tema.cores.branco} />
          <Text style={estilos.parecerTexto}>Resposta Ruim</Text>
        </Pressable>
      </View>

      <Modal visible={modalAberto} transparent animationType="fade" onRequestClose={() => setModalAberto(false)}>
        <View style={estilos.modalFundo}>
          <View style={estilos.modalCartao}>
            <Text style={estilos.titulo}>{positivo ? "Dar feedback positivo" : "Dar feedback negativo"}</Text>
            {positivo ? null : (
              <View style={estilos.classes}>
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
              </View>
            )}
            <Text style={estilos.etiqueta}>Dê os detalhes: (opcional)</Text>
            <TextInput
              value={comentario}
              onChangeText={setComentario}
              editable={!aEnviar}
              multiline
              maxLength={2000}
              placeholder={positivo ? "O que foi satisfatório na resposta?" : "O que esteve mal na resposta?"}
              placeholderTextColor={tema.cores.muted}
              style={estilos.campo}
            />
            <Text style={estilos.relatorio}>{TEXTO_RELATORIO}</Text>
            <View style={estilos.botoesDialogo}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setModalAberto(false)}
                disabled={aEnviar}
                style={estilos.cancelar}
              >
                <Text style={estilos.cancelarTexto}>Cancelar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void enviar()}
                disabled={aEnviar || classeEscolhida === null}
                style={[estilos.enviar, (aEnviar || classeEscolhida === null) && estilos.inactivo]}
              >
                {aEnviar ? <ActivityIndicator color={tema.cores.branco} /> : <Text style={estilos.enviarTexto}>Enviar</Text>}
              </Pressable>
            </View>
          </View>
          {toast && modalAberto ? (
            <View pointerEvents="none" style={[estilos.toastTopo, { top: insets.top + tema.espaco.md }]}>
              <FaixaToast texto={toast.texto} sucesso={toast.sucesso} />
            </View>
          ) : null}
        </View>
      </Modal>
      <ToastAviso
        texto={toast?.texto ?? ""}
        sucesso={toast?.sucesso ?? false}
        visivel={toast !== null && !modalAberto}
        onFechar={() => setToast(null)}
      />
    </>
  );
}

const estilos = StyleSheet.create({
  accoes: { flexDirection: "row", gap: tema.espaco.sm, backgroundColor: "transparent" },
  parecer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tema.espaco.sm,
    minHeight: tema.alturaToque,
    borderRadius: tema.raio.pill,
    paddingHorizontal: tema.espaco.sm,
    paddingVertical: tema.espaco.sm,
  },
  parecerBom: { backgroundColor: tema.cores.primario },
  parecerRuim: { backgroundColor: tema.cores.erro },
  parecerTexto: { color: tema.cores.branco, fontSize: tema.tipo.sm, fontWeight: "700", flexShrink: 1 },
  modalFundo: {
    flex: 1,
    backgroundColor: tema.cores.overlay,
    justifyContent: "center",
    padding: tema.espaco.lg,
  },
  modalCartao: {
    backgroundColor: tema.cores.branco,
    borderRadius: tema.raio.lg,
    padding: tema.espaco.xl,
    gap: tema.espaco.md,
    ...sombraFlutuante,
  },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
  etiqueta: { color: tema.cores.muted, fontSize: tema.tipo.sm },
  campo: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: tema.cores.primario,
    borderRadius: tema.raio.sm,
    padding: tema.espaco.md,
    color: tema.cores.texto,
    fontSize: tema.tipo.md,
    textAlignVertical: "top",
    backgroundColor: tema.cores.branco,
  },
  relatorio: { color: tema.cores.muted, fontSize: tema.tipo.sm, lineHeight: 20 },
  botoesDialogo: { flexDirection: "row", justifyContent: "flex-end", gap: tema.espaco.sm, marginTop: tema.espaco.sm },
  cancelar: {
    borderRadius: tema.raio.pill,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
    backgroundColor: tema.cores.branco,
    paddingHorizontal: tema.espaco.lg,
    paddingVertical: tema.espaco.sm,
  },
  cancelarTexto: { color: tema.cores.texto, fontSize: tema.tipo.sm, fontWeight: "700" },
  enviar: {
    borderRadius: tema.raio.pill,
    backgroundColor: tema.cores.marinho,
    paddingHorizontal: tema.espaco.lg,
    paddingVertical: tema.espaco.sm,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  enviarTexto: { color: tema.cores.branco, fontSize: tema.tipo.sm, fontWeight: "700" },
  inactivo: { opacity: tema.opacidadeDesactivado },
  classes: { gap: tema.espaco.sm },
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
  toastTopo: { position: "absolute", left: tema.espaco.lg, right: tema.espaco.lg },
});
