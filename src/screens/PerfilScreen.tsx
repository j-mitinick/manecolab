import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput } from "react-native";

import { BadgeFuncao } from "../components/BadgeFuncao";
import { BotaoPrimario } from "../components/BotaoPrimario";
import { MolduraApp } from "../components/MolduraApp";
import { Vidro } from "../components/Vidro";
import { useAuth } from "../context/AuthContext";
import { alertarSeRede, mensagemDeErro } from "../services/api";
import { tema } from "../theme/theme";
import { ROTULO_NIVEL } from "../utils/rotulos";

export function PerfilScreen() {
  const { utilizador, sair, alterarSenha } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  async function submeter() {
    if (senhaNova.length < 8) {
      setErro("A nova palavra-passe tem de ter pelo menos 8 caracteres.");
      return;
    }
    setAGuardar(true);
    setErro(null);
    try {
      await alterarSenha(senhaAtual, senhaNova);
      Alert.alert("Palavra-passe alterada", "A sessão foi terminada. Entre novamente.");
    } catch (falha) {
      alertarSeRede(falha);
      setErro(mensagemDeErro(falha));
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
            <TextInput
              secureTextEntry
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              placeholder="Palavra-passe actual"
              placeholderTextColor={tema.cores.muted}
              style={estilos.campo}
            />
            <TextInput
              secureTextEntry
              value={senhaNova}
              onChangeText={setSenhaNova}
              placeholder="Nova palavra-passe (mín. 8)"
              placeholderTextColor={tema.cores.muted}
              style={estilos.campo}
            />
            {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
            <BotaoPrimario titulo="Guardar palavra-passe" onPress={() => void submeter()} aCarregar={aGuardar} />
          </Vidro>
          <BotaoPrimario titulo="Sair" variante="perigo" onPress={() => void sair()} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  campo: {
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
    borderRadius: tema.raio.sm,
    paddingHorizontal: tema.espaco.md,
    paddingVertical: tema.espaco.md,
    color: tema.cores.texto,
    fontSize: tema.tipo.md,
    backgroundColor: tema.cores.fundo,
  },
  erro: { color: tema.cores.erro, fontSize: tema.tipo.sm },
});
