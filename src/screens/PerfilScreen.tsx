import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { BadgeFuncao } from "../components/BadgeFuncao";
import { BotaoPrimario } from "../components/BotaoPrimario";
import { MolduraApp } from "../components/MolduraApp";
import { ToastAviso } from "../components/ToastAviso";
import { Vidro } from "../components/Vidro";
import { useAuth } from "../context/AuthContext";
import { mensagemDeErro } from "../services/api";
import { tema } from "../theme/theme";
import { ROTULO_NIVEL } from "../utils/rotulos";

export function PerfilScreen() {
  const { utilizador, sair, alterarSenha } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [verAtual, setVerAtual] = useState(false);
  const [verNova, setVerNova] = useState(false);
  const [toast, setToast] = useState<{ texto: string; sucesso: boolean } | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const terminarSessao = useRef(false);

  const fecharToast = useCallback(() => {
    setToast(null);
    if (terminarSessao.current) {
      terminarSessao.current = false;
      void sair();
    }
  }, [sair]);

  async function submeter() {
    if (senhaNova.length < 8) {
      setToast({ texto: "A nova palavra-passe tem de ter pelo menos 8 caracteres.", sucesso: false });
      return;
    }
    setAGuardar(true);
    try {
      await alterarSenha(senhaAtual, senhaNova);
      terminarSessao.current = true;
      setToast({ texto: "Palavra-passe alterada. Entre novamente.", sucesso: true });
    } catch (falha) {
      setToast({ texto: mensagemDeErro(falha), sucesso: false });
      setAGuardar(false);
    }
  }

  if (!utilizador) {
    return null;
  }

  return (
    <MolduraApp>
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          <Text style={estilos.titulo}>Perfil</Text>
          <Vidro style={estilos.cartao}>
            <Text style={estilos.nome}>
              {utilizador.primeiro_nome} {utilizador.ultimo_nome}
            </Text>
            <Text style={estilos.meta}>{utilizador.email}</Text>
            <BadgeFuncao funcao={utilizador.funcao} />
            <Text style={estilos.meta}>Experiência: {ROTULO_NIVEL[utilizador.nivel_experiencia]}</Text>
          </Vidro>
          <Vidro style={estilos.cartao}>
            <Text style={estilos.subtitulo}>Alterar palavra-passe</Text>
            <Text style={estilos.meta}>Depois de gravar, o servidor invalida a sessão e é preciso entrar de novo.</Text>
            <View style={estilos.campoLinha}>
              <TextInput
                secureTextEntry={!verAtual}
                value={senhaAtual}
                onChangeText={setSenhaAtual}
                placeholder="Palavra-passe actual"
                placeholderTextColor={tema.cores.muted}
                style={estilos.campo}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={verAtual ? "Esconder palavra-passe actual" : "Ver palavra-passe actual"}
                onPress={() => setVerAtual((visivel) => !visivel)}
                style={estilos.olho}
              >
                <Ionicons name={verAtual ? "eye-off-outline" : "eye-outline"} size={22} color={tema.cores.muted} />
              </Pressable>
            </View>
            <View style={estilos.campoLinha}>
              <TextInput
                secureTextEntry={!verNova}
                value={senhaNova}
                onChangeText={setSenhaNova}
                placeholder="Nova palavra-passe (mín. 8)"
                placeholderTextColor={tema.cores.muted}
                style={estilos.campo}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={verNova ? "Esconder nova palavra-passe" : "Ver nova palavra-passe"}
                onPress={() => setVerNova((visivel) => !visivel)}
                style={estilos.olho}
              >
                <Ionicons name={verNova ? "eye-off-outline" : "eye-outline"} size={22} color={tema.cores.muted} />
              </Pressable>
            </View>
            <BotaoPrimario titulo="Guardar palavra-passe" onPress={() => void submeter()} aCarregar={aGuardar} />
          </Vidro>
          <BotaoPrimario titulo="Sair" variante="perigo" onPress={() => void sair()} />
        </ScrollView>
      </KeyboardAvoidingView>
      <ToastAviso
        texto={toast?.texto ?? ""}
        sucesso={toast?.sucesso ?? false}
        visivel={toast !== null}
        onFechar={fecharToast}
      />
    </MolduraApp>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { padding: tema.espaco.lg, gap: tema.espaco.lg },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
  subtitulo: { color: tema.cores.texto, fontSize: tema.tipo.lg, fontWeight: "700" },
  cartao: {
    borderRadius: tema.raio.lg,
    padding: tema.espaco.lg,
    gap: tema.espaco.md,
  },
  nome: { color: tema.cores.texto, fontSize: tema.tipo.lg, fontWeight: "700" },
  meta: { color: tema.cores.muted, fontSize: tema.tipo.sm, lineHeight: 20 },
  campoLinha: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
    borderRadius: tema.raio.sm,
    backgroundColor: tema.cores.fundo,
  },
  campo: {
    flex: 1,
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.md,
    color: tema.cores.texto,
    fontSize: tema.tipo.md,
  },
  olho: {
    minWidth: tema.alturaToque,
    minHeight: tema.alturaToque,
    alignItems: "center",
    justifyContent: "center",
  },
});
