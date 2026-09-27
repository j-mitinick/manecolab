import { Pressable, StyleSheet, Text, View } from "react-native";

import { tema } from "../theme/theme";
import type { ClasseNome } from "../types/api";
import { CLASSES, ROTULO_CLASSE } from "../utils/rotulos";

interface Props {
  mapas: Partial<Record<ClasseNome, string>>;
  activa: ClasseNome | null;
  onMudar: (classe: ClasseNome) => void;
}

export function AbasXAI({ mapas, activa, onMudar }: Props) {
  const chaves = CLASSES.filter((classe) => Boolean(mapas[classe]));
  if (chaves.length === 0) {
    return null;
  }
  return (
    <View style={estilos.fila}>
      {chaves.map((classe) => {
        const seleccionada = classe === activa;
        return (
          <Pressable
            key={classe}
            accessibilityRole="tab"
            accessibilityState={{ selected: seleccionada }}
            onPress={() => onMudar(classe)}
            style={[estilos.aba, seleccionada && estilos.abaActiva]}
          >
            <Text style={[estilos.texto, seleccionada && estilos.textoActivo]}>{ROTULO_CLASSE[classe]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: "row", flexWrap: "wrap", gap: tema.espaco.sm },
  aba: {
    borderRadius: tema.raio.pill,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.sm,
    backgroundColor: tema.cores.superficie,
  },
  abaActiva: { backgroundColor: tema.cores.primario, borderColor: tema.cores.primario },
  texto: { color: tema.cores.muted, fontSize: tema.tipo.sm, fontWeight: "700" },
  textoActivo: { color: tema.cores.branco },
});
