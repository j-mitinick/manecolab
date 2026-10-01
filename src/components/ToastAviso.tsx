import { useEffect, useRef } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sombraFlutuante, tema } from "../theme/theme";

interface FaixaProps {
  texto: string;
  sucesso: boolean;
}

interface Props extends FaixaProps {
  visivel: boolean;
  onFechar: () => void;
}

export function FaixaToast({ texto, sucesso }: FaixaProps) {
  return (
    <View style={[estilos.faixa, sucesso ? estilos.ok : estilos.erro]}>
      <Ionicons name={sucesso ? "checkmark-circle" : "alert-circle"} size={18} color={tema.cores.branco} />
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

export function ToastAviso({ texto, sucesso, visivel, onFechar }: Props) {
  const insets = useSafeAreaInsets();
  const fechar = useRef(onFechar);
  fechar.current = onFechar;

  useEffect(() => {
    if (!visivel) {
      return;
    }
    const temporizador = setTimeout(() => fechar.current(), 3200);
    return () => clearTimeout(temporizador);
  }, [visivel, texto]);

  return (
    <Modal visible={visivel} transparent animationType="fade">
      <View pointerEvents="box-none" style={[estilos.fundo, { paddingTop: insets.top + tema.espaco.md }]}>
        <FaixaToast texto={texto} sucesso={sucesso} />
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, paddingHorizontal: tema.espaco.lg },
  faixa: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: tema.espaco.sm,
    borderRadius: tema.raio.md,
    paddingHorizontal: tema.espaco.lg,
    paddingVertical: tema.espaco.md,
    ...sombraFlutuante,
  },
  ok: { backgroundColor: tema.cores.sucesso },
  erro: { backgroundColor: tema.cores.erro },
  texto: { color: tema.cores.branco, fontSize: tema.tipo.sm, fontWeight: "700", flex: 1 },
});
