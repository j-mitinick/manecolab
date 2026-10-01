import { useEffect, useState } from "react";
import { Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aparicao } from "../components/Aparicao";
import { BotaoPrimario } from "../components/BotaoPrimario";
import { Vidro } from "../components/Vidro";
import { useAuth } from "../context/AuthContext";
import { obterSaude } from "../services/api";
import { tema } from "../theme/theme";

export function LoginScreen() {
  const { entrar } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("admin@cxr.local");
  const [senha, setSenha] = useState("AltereEstaSenha1");
  const [erro, setErro] = useState<string | null>(null);
  const [aEntrar, setAEntrar] = useState(false);
  const [apiIndisponivel, setApiIndisponivel] = useState(false);

  useEffect(() => {
    let vivo = true;
    obterSaude()
      .then(() => {
        if (vivo) {
          setApiIndisponivel(false);
        }
      })
      .catch(() => {
        if (vivo) {
          setApiIndisponivel(true);
        }
      });
    return () => {
      vivo = false;
    };
  }, []);

  async function submeter() {
    if (!email.trim() || !senha) {
      setErro("Indique o email e a palavra-passe.");
      return;
    }
    setAEntrar(true);
    setErro(null);
    try {
      await entrar(email, senha);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Email ou senha incorrectos.");
    } finally {
      setAEntrar(false);
    }
  }

  return (
    <ImageBackground source={require("../../assets/login-fundo.jpg")} style={estilos.ecra} resizeMode="cover">
      <KeyboardAvoidingView style={estilos.transparente} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={estilos.transparente}
          contentContainerStyle={[estilos.conteudo, { paddingTop: insets.top + tema.espaco.xl, paddingBottom: insets.bottom + tema.espaco.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Aparicao>
            <Image source={require("../../assets/logo-sem-fundo.png")} accessibilityLabel="ManecoLab" style={estilos.logo} resizeMode="contain" />
            {/*<Text style={estilos.lead}>Classificação assistida de radiografia de tórax. Apoio à leitura, não é diagnóstico.</Text>*/}
          </Aparicao>
          <Aparicao atraso={140}>
            <Vidro isolado style={[estilos.folha, { width: width * 0.7 }]} intensidade={62}>
              {apiIndisponivel ? (
                <View style={estilos.banner}>
                  <Text style={estilos.bannerTexto}>API indisponível. Confirme o IP em EXPO_PUBLIC_API_URL e a mesma rede Wi-Fi.</Text>
                </View>
              ) : null}
              <Text style={estilos.etiqueta}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="nome@unidade.ao"
                placeholderTextColor={tema.cores.muted}
                style={estilos.campo}
              />
              <Text style={estilos.etiqueta}>Palavra-passe</Text>
              <TextInput
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                placeholder="Palavra-passe"
                placeholderTextColor={tema.cores.muted}
                style={estilos.campo}
              />
              {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
              <BotaoPrimario titulo="Entrar" onPress={() => void submeter()} aCarregar={aEntrar} />
              {/*<Text style={estilos.nota}>
                A sua conta é criada pelo administrador da unidade. Contacte o responsável se não conseguir entrar.
              </Text>*/}
              {/*<Text style={estilos.servidor}>Servidor: {urlApi}</Text>*/}
            </Vidro>
          </Aparicao>
        </ScrollView>
      </KeyboardAvoidingView>
      <Text style={[estilos.credito, { bottom: insets.bottom + tema.espaco.md }]}>criado por: José Reis</Text>
    </ImageBackground>
  );
}

const estilos = StyleSheet.create({
  ecra: { flex: 1, backgroundColor: tema.cores.marinhoProfundo },
  transparente: { flex: 1, backgroundColor: "transparent" },
  conteudo: { flexGrow: 1, justifyContent: "center", alignItems: "center", gap: tema.espaco.xl },
  logo: { width: 240, height: 120 },
  credito: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: tema.cores.loginTextoSecundario,
    fontSize: tema.tipo.sm,
  },
  lead: { color: tema.cores.loginTexto, fontSize: tema.tipo.md, lineHeight: 22, maxWidth: 320, marginTop: tema.espaco.sm },
  folha: {
    borderRadius: tema.raio.lg,
    padding: tema.espaco.xl,
    gap: tema.espaco.md,
  },
  etiqueta: { color: tema.cores.texto, fontSize: tema.tipo.sm, fontWeight: "700" },
  campo: {
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.linha,
    borderRadius: tema.raio.pill,
    paddingHorizontal: tema.espaco.lg,
    paddingVertical: tema.espaco.md,
    color: tema.cores.texto,
    fontSize: tema.tipo.md,
    backgroundColor: tema.cores.superficieAlta,
  },
  erro: { color: tema.cores.erro, fontSize: tema.tipo.sm },
  nota: { color: tema.cores.muted, fontSize: tema.tipo.sm, lineHeight: 20 },
  servidor: { color: tema.cores.muted, fontSize: tema.tipo.xs },
  banner: {
    backgroundColor: tema.cores.erroFundo,
    borderRadius: tema.raio.md,
    padding: tema.espaco.md,
    borderWidth: tema.linhaBorda,
    borderColor: tema.cores.erro,
  },
  bannerTexto: { color: tema.cores.texto, fontSize: tema.tipo.sm, lineHeight: 20 },
});
