import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../context/AuthContext";
import type { RotasApp } from "../navigation/tipos";
import { tema } from "../theme/theme";
import { podeVerTreino } from "../utils/rotulos";
import { Vidro } from "./Vidro";

const LIGACOES: {
  nome: keyof RotasApp;
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  soTreino?: boolean;
}[] = [
  { nome: "Diagnostico", titulo: "Ler", icone: "scan-outline" },
  { nome: "Historico", titulo: "Histórico", icone: "time-outline" },
  { nome: "Treino", titulo: "Modelos", icone: "layers-outline", soTreino: true },
  { nome: "Perfil", titulo: "Perfil", icone: "person-outline" },
];

export function BarraInferior() {
  const { utilizador } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RotasApp>>();
  const rota = useRoute();
  const insets = useSafeAreaInsets();
  const itens = LIGACOES.filter((item) => !item.soTreino || (utilizador && podeVerTreino(utilizador.funcao)));
  const medidas = useRef<Record<string, { x: number; largura: number }>>({});
  const indicadorX = useRef(new Animated.Value(0)).current;
  const indicadorLargura = useRef(new Animated.Value(0)).current;

  function moverPara(nome: string) {
    const medida = medidas.current[nome];
    if (!medida) {
      return;
    }
    Animated.parallel([
      Animated.spring(indicadorX, {
        toValue: medida.x,
        useNativeDriver: false,
        stiffness: 240,
        damping: 22,
        mass: 0.7,
      }),
      Animated.spring(indicadorLargura, {
        toValue: medida.largura,
        useNativeDriver: false,
        stiffness: 240,
        damping: 22,
        mass: 0.7,
      }),
    ]).start();
  }

  useEffect(() => {
    moverPara(rota.name);
  }, [rota.name, itens.length]);

  return (
    <View style={[estilos.envoltorio, { paddingBottom: insets.bottom + tema.espaco.xl }]}>
      <Vidro style={estilos.barra} intensidade={70}>
        <View style={estilos.fila}>
          <Animated.View
            pointerEvents="none"
            style={[estilos.indicador, { left: indicadorX, width: indicadorLargura }]}
          />
          {itens.map((item) => {
            const activa = rota.name === item.nome;
            return (
              <ItemBarra
                key={item.nome}
                titulo={item.titulo}
                icone={item.icone}
                activa={activa}
                onMedir={(x, largura) => {
                  medidas.current[item.nome] = { x, largura };
                  if (item.nome === rota.name) {
                    moverPara(item.nome);
                  }
                }}
                onPress={() => navigation.navigate(item.nome)}
              />
            );
          })}
        </View>
      </Vidro>
    </View>
  );
}

function ItemBarra({
  titulo,
  icone,
  activa,
  onPress,
  onMedir,
}: {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  activa: boolean;
  onPress: () => void;
  onMedir: (x: number, largura: number) => void;
}) {
  const escala = useRef(new Animated.Value(1)).current;

  function animar(para: number) {
    Animated.spring(escala, { toValue: para, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      onPressIn={() => animar(0.9)}
      onPressOut={() => animar(1)}
      onLayout={(evento) => onMedir(evento.nativeEvent.layout.x, evento.nativeEvent.layout.width)}
      style={estilos.item}
    >
      <Animated.View style={[estilos.conteudoItem, { transform: [{ scale: escala }] }]}>
        <Ionicons name={icone} size={20} color={activa ? tema.cores.primario : tema.cores.muted} />
        <Text style={[estilos.texto, activa && estilos.textoActivo]}>{titulo}</Text>
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  envoltorio: {
    paddingHorizontal: tema.espaco.lg,
    paddingTop: tema.espaco.sm,
  },
  barra: {
    borderRadius: tema.raio.pill,
    padding: tema.espaco.xs,
  },
  fila: { flexDirection: "row", position: "relative" },
  indicador: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: tema.raio.pill,
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: tema.linhaBorda,
    borderColor: "rgba(255,255,255,0.9)",
  },
  item: { flex: 1 },
  conteudoItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: tema.espaco.xs,
    paddingVertical: tema.espaco.sm,
  },
  texto: { color: tema.cores.muted, fontSize: tema.tipo.xs, fontWeight: "600" },
  textoActivo: { color: tema.cores.primario, fontWeight: "700" },
});
