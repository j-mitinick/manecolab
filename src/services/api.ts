import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { Alert } from "react-native";

import type {
  FeedbackCriar,
  FeedbackPublico,
  FicheiroImagem,
  HealthResposta,
  ModeloTreino,
  PredictResposta,
  PredicaoResumo,
  TokenResposta,
  UtilizadorPublico,
} from "../types/api";

const TIMEOUT_PADRAO_MS = 15_000;
const TIMEOUT_PREDICT_MS = 120_000;

function lerUrlApi(): string {
  const bruto = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (bruto) {
    return bruto;
  }
  return "http://10.0.2.2:8000";
}

export const urlApi = lerUrlApi();

let tokenMemoria: string | null = null;
let aoNaoAutorizado: (() => void) | null = null;

export function definirToken(token: string | null): void {
  tokenMemoria = token;
}

export function definirAoNaoAutorizado(callback: (() => void) | null): void {
  aoNaoAutorizado = callback;
}

export const cliente = axios.create({
  baseURL: urlApi,
  timeout: TIMEOUT_PADRAO_MS,
  headers: { Accept: "application/json" },
});

cliente.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const url = config.url ?? "";
  if (tokenMemoria && !url.includes("/auth/login")) {
    config.headers.set("Authorization", `Bearer ${tokenMemoria}`);
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }
  return config;
});

cliente.interceptors.response.use(
  (resposta) => resposta,
  (erro: unknown) => {
    if (axios.isAxiosError(erro) && erro.response?.status === 401) {
      const url = erro.config?.url ?? "";
      if (!url.includes("/auth/login")) {
        aoNaoAutorizado?.();
      }
    }
    return Promise.reject(erro);
  },
);

export type ContextoErro = "login" | "predict" | "geral";

function detalheFastApi(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("detail" in data)) {
    return null;
  }
  const detalhe = (data as { detail?: unknown }).detail;
  if (typeof detalhe === "string" && detalhe.trim()) {
    return detalhe;
  }
  if (Array.isArray(detalhe)) {
    const msgs = detalhe
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
    return msgs.length > 0 ? msgs.join(" ") : null;
  }
  return null;
}

export function eErroDeRede(erro: unknown): boolean {
  if (!axios.isAxiosError(erro)) {
    return false;
  }
  return !erro.response && erro.code !== "ERR_CANCELED";
}

export function mensagemDeErro(erro: unknown, contexto: ContextoErro = "geral"): string {
  if (axios.isAxiosError(erro)) {
    if (erro.code === "ECONNABORTED") {
      if (contexto === "predict") {
        return "A inferência excedeu o tempo de espera. Confirme que a API está a correr e tente de novo.";
      }
      return "O servidor demorou demasiado a responder.";
    }
    if (eErroDeRede(erro)) {
      return "Sem ligação ao servidor. Confirme o IP da API e a mesma rede Wi-Fi.";
    }
    const estado = erro.response?.status;
    if (contexto === "login" && estado === 401) {
      return "Email ou senha incorrectos.";
    }
    if (contexto === "login" && estado === 403) {
      return "Conta bloqueada.";
    }
    const detalhe = detalheFastApi(erro.response?.data);
    if (detalhe) {
      return detalhe;
    }
    if (estado === 401) {
      return "Sessão expirada. Entre novamente.";
    }
    if (estado === 403) {
      return "Sem permissão para esta acção.";
    }
  }
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return "Não foi possível concluir o pedido.";
}

export function alertarSeRede(erro: unknown): void {
  if (eErroDeRede(erro)) {
    Alert.alert("Sem ligação", "Sem ligação ao servidor. Confirme o IP da API e a mesma rede Wi-Fi.");
  }
}

export function erroHttp(erro: unknown): AxiosError | null {
  return axios.isAxiosError(erro) ? erro : null;
}

export async function obterSaude(): Promise<HealthResposta> {
  const { data } = await cliente.get<HealthResposta>("/health");
  return data;
}

export async function entrarSessao(email: string, senha: string): Promise<TokenResposta> {
  const { data } = await cliente.post<TokenResposta>("/auth/login", {
    email: email.trim().toLowerCase(),
    senha,
  });
  return data;
}

export async function obterEu(): Promise<UtilizadorPublico> {
  const { data } = await cliente.get<UtilizadorPublico>("/auth/me");
  return data;
}

export async function alterarSenhaApi(senhaAtual: string, senhaNova: string): Promise<UtilizadorPublico> {
  const { data } = await cliente.post<UtilizadorPublico>("/auth/senha", {
    senha_atual: senhaAtual,
    senha_nova: senhaNova,
  });
  return data;
}

export async function classificarImagem(
  ficheiro: FicheiroImagem,
  incluirXai: boolean,
  modeloXai?: string,
): Promise<PredictResposta> {
  const dados = new FormData();
  dados.append("file", {
    uri: ficheiro.uri,
    name: ficheiro.name,
    type: ficheiro.type,
  } as unknown as Blob);
  const params: { incluir_xai: boolean; modelo_xai?: string } = { incluir_xai: incluirXai };
  if (incluirXai && modeloXai) {
    params.modelo_xai = modeloXai;
  }
  const { data } = await cliente.post<PredictResposta>("/predict", dados, {
    params,
    timeout: TIMEOUT_PREDICT_MS,
    transformRequest: (corpo) => corpo,
  });
  return data;
}

export async function submeterFeedback(
  predicaoId: number,
  corpo: FeedbackCriar,
): Promise<FeedbackPublico> {
  const { data } = await cliente.post<FeedbackPublico>(`/predicoes/${predicaoId}/feedback`, {
    classe_proposta: corpo.classe_proposta,
    comentario: corpo.comentario ?? null,
  });
  return data;
}

export async function listarPredicoes(): Promise<PredicaoResumo[]> {
  const { data } = await cliente.get<PredicaoResumo[]>("/predicoes");
  return data;
}

function bytesParaBase64(bytes: Uint8Array): string {
  const tabela = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let saida = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = i + 1 < bytes.length ? (bytes[i + 1] ?? 0) : 0;
    const c = i + 2 < bytes.length ? (bytes[i + 2] ?? 0) : 0;
    const triplo = (a << 16) | (b << 8) | c;
    saida += tabela[(triplo >> 18) & 63];
    saida += tabela[(triplo >> 12) & 63];
    saida += i + 1 < bytes.length ? tabela[(triplo >> 6) & 63] : "=";
    saida += i + 2 < bytes.length ? tabela[triplo & 63] : "=";
  }
  return saida;
}

function corpoParaBytes(data: ArrayBuffer | Uint8Array | string): Uint8Array {
  if (typeof data === "string") {
    const bytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i += 1) {
      bytes[i] = data.charCodeAt(i) & 0xff;
    }
    return bytes;
  }
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

export async function obterImagemPredicao(id: number): Promise<string> {
  const { data, headers } = await cliente.get<ArrayBuffer>(`/predicoes/${id}/imagem`, {
    responseType: "arraybuffer",
    headers: { Accept: "image/*" },
    timeout: 60_000,
    transformResponse: [(corpo) => corpo],
  });
  const bruto = headers["content-type"];
  const tipo = typeof bruto === "string" ? bruto.split(";")[0].trim().toLowerCase() : "image/jpeg";
  const media = tipo.startsWith("image/") ? tipo : "image/jpeg";
  return `data:${media};base64,${bytesParaBase64(corpoParaBytes(data))}`;
}

export async function listarFichasTreino(): Promise<ModeloTreino[]> {
  const { data } = await cliente.get<ModeloTreino[]>("/modelos/treino");
  return data;
}
