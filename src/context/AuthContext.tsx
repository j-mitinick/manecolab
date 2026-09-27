import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  alertarSeRede,
  alterarSenhaApi,
  definirAoNaoAutorizado,
  definirToken,
  entrarSessao,
  mensagemDeErro,
  obterEu,
} from "../services/api";
import {
  apagarToken,
  guardarToken,
  lerApdAceite,
  lerOnboardingVisto,
  lerToken,
  marcarApdAceite,
  marcarOnboardingVisto,
} from "../storage/sessaoLocal";
import type { UtilizadorPublico } from "../types/api";

interface AuthContextValue {
  pronto: boolean;
  onboardingVisto: boolean;
  apdAceite: boolean;
  utilizador: UtilizadorPublico | null;
  autenticado: boolean;
  concluirOnboarding: () => Promise<void>;
  aceitarApd: () => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  alterarSenha: (senhaAtual: string, senhaNova: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [onboardingVisto, setOnboardingVisto] = useState(false);
  const [apdAceite, setApdAceite] = useState(false);
  const [utilizador, setUtilizador] = useState<UtilizadorPublico | null>(null);

  const sair = useCallback(async () => {
    definirToken(null);
    await apagarToken();
    setUtilizador(null);
  }, []);

  useEffect(() => {
    definirAoNaoAutorizado(() => {
      void sair();
    });
    return () => definirAoNaoAutorizado(null);
  }, [sair]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [onboarding, apd, token] = await Promise.all([
          lerOnboardingVisto(),
          lerApdAceite(),
          lerToken(),
        ]);
        if (!vivo) {
          return;
        }
        setOnboardingVisto(onboarding);
        setApdAceite(apd);
        if (token) {
          definirToken(token);
          try {
            const eu = await obterEu();
            if (!vivo) {
              return;
            }
            setUtilizador(eu);
          } catch {
            definirToken(null);
            await apagarToken();
            if (!vivo) {
              return;
            }
            setUtilizador(null);
          }
        }
      } finally {
        if (vivo) {
          setPronto(true);
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const concluirOnboarding = useCallback(async () => {
    await marcarOnboardingVisto();
    setOnboardingVisto(true);
  }, []);

  const aceitarApd = useCallback(async () => {
    await marcarApdAceite();
    setApdAceite(true);
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    try {
      const resposta = await entrarSessao(email, senha);
      if (resposta.utilizador.bloqueado) {
        throw new Error("Conta bloqueada.");
      }
      await guardarToken(resposta.access_token);
      definirToken(resposta.access_token);
      setUtilizador(resposta.utilizador);
    } catch (erro) {
      definirToken(null);
      alertarSeRede(erro);
      throw new Error(mensagemDeErro(erro, "login"));
    }
  }, []);

  const alterarSenha = useCallback(
    async (senhaAtual: string, senhaNova: string) => {
      await alterarSenhaApi(senhaAtual, senhaNova);
      await sair();
    },
    [sair],
  );

  const valor = useMemo<AuthContextValue>(
    () => ({
      pronto,
      onboardingVisto,
      apdAceite,
      utilizador,
      autenticado: utilizador !== null,
      concluirOnboarding,
      aceitarApd,
      entrar,
      sair,
      alterarSenha,
    }),
    [pronto, onboardingVisto, apdAceite, utilizador, concluirOnboarding, aceitarApd, entrar, sair, alterarSenha],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth tem de estar dentro de AuthProvider.");
  }
  return ctx;
}
