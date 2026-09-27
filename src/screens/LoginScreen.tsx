import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Aparicao } from "../components/Aparicao";
import { BotaoPrimario } from "../components/BotaoPrimario";
import { FundoClinico } from "../components/FundoClinico";
import { Vidro } from "../components/Vidro";
import { useAuth } from "../context/AuthContext";
import { obterSaude } from "../services/api";
import { tema } from "../theme/theme";

export function LoginScreen() {
  const { entrar } = useAuth();
  const insets = useSafeAreaInsets();
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
    <FundoClinico>
      <KeyboardAvoidingView style={estilos.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[estilos.conteudo, { paddingTop: insets.top + tema.espaco.xxl, paddingBottom: insets.bottom + tema.espaco.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Aparicao>
            <Text style={estilos.kicker}>Radiologia</Text>
            <Text style={estilos.titulo}>ManecoLab</Text>
            <Text style={estilos.lead}>Classificação assistida de radiografia de tórax. Apoio à leitura, não é diagnóstico.</Text>
          </Aparicao>
          <Aparicao atraso={140}>
            <Vidro style={estilos.folha} intensidade={62}>
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
              <Text style={estilos.nota}>
                A sua conta é criada pelo administrador da unidade. Contacte o responsável se não conseguir entrar.
              </Text>
              {/*<Text style={estilos.servidor}>Servidor: {urlApi}</Text>*/}
            </Vidro>
          </Aparicao>
        </ScrollView>
      </KeyboardAvoidingView>
    </FundoClinico>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { flexGrow: 1, justifyContent: "flex-end", paddingHorizontal: tema.espaco.lg, gap: tema.espaco.xl },
  kicker: { color: tema.cores.teal, fontSize: tema.tipo.xs, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  titulo: { color: tema.cores.texto, fontSize: tema.tipo.display, fontWeight: "700", marginTop: tema.espaco.xs },
  lead: { color: tema.cores.muted, fontSize: tema.tipo.md, lineHeight: 22, maxWidth: 320, marginTop: tema.espaco.sm },
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
