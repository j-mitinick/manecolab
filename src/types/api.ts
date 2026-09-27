export type ClasseNome = "covid" | "pneumonia" | "tuberculose" | "normal";
export type FuncaoNome = "medico" | "radiologista" | "admin";
export type NivelExperiencia = "junior" | "pleno" | "senior";
export type EstadoFeedback = "pendente" | "aceite" | "rejeitado";

export interface SoftmaxClasses {
  covid: number;
  pneumonia: number;
  tuberculose: number;
  normal: number;
}

export interface BlocoEnsemble {
  componentes: string[];
  agregacao: "media_aritmetica";
  probabilidades: SoftmaxClasses;
  classe_predita: ClasseNome;
  confianca: number;
  nota: string | null;
}

export interface UtilizadorPublico {
  id: number;
  email: string;
  primeiro_nome: string;
  ultimo_nome: string;
  funcao: FuncaoNome;
  nivel_experiencia: NivelExperiencia;
  bloqueado: boolean;
  criado_em: string;
  criado_por_id: number | null;
  criado_por_nome: string | null;
}

export interface TokenResposta {
  access_token: string;
  token_type: "bearer";
  expires_in_s: number;
  utilizador: UtilizadorPublico;
}

export interface PredictResposta {
  formulacao: "multiclasse_softmax";
  classes: ClasseNome[];
  predicao_id: number;
  probabilidades_individuais: Record<string, SoftmaxClasses>;
  ensemble_oficial: BlocoEnsemble;
  ensemble_4_cnn: BlocoEnsemble;
  alerta_incerteza: boolean;
  xai_modelo: string | null;
  visualizacao_xai: Partial<Record<ClasseNome, string>>;
  limiares_triagem_validacao: Record<string, unknown> | null;
  nota_limiares: string | null;
  nota_clinica: string;
  protocolo_feedback: string;
  tempos_inferencia_s: Record<string, number>;
}

export interface FeedbackCriar {
  classe_proposta: ClasseNome;
  comentario?: string | null;
}

export interface FeedbackPublico {
  id: number;
  predicao_id: number;
  utilizador_id: number;
  utilizador_nome: string;
  classe_proposta: ClasseNome;
  classe_modelo: ClasseNome;
  concorda_com_modelo: boolean;
  comentario: string | null;
  estado: EstadoFeedback;
  peso: number;
  nivel_experiencia: NivelExperiencia;
  criado_em: string;
  revisto_por_nome: string | null;
  revisto_em: string | null;
  nota_revisao: string | null;
  aviso_proteccao: string | null;
}

export interface HealthResposta {
  estado: string;
  formulacao: "multiclasse_softmax";
  classes: string[];
  device: string;
  tensorflow: string;
  keras: string;
  modelos_carregados: string[];
  model_dir: string;
}

export interface PredicaoResumo {
  id: number;
  nome_ficheiro: string;
  classe_predita: ClasseNome;
  confianca: number;
  alerta_incerteza: boolean;
  criado_em: string;
  autor_nome: string;
  n_feedbacks: number;
}

export interface ModeloTreino {
  nome: string;
  ficheiro: string;
  tamanho_bytes: number | null;
  seed: number;
  carregado: boolean;
  ensemble_oficial: boolean;
  classes: string[];
  entrada: string;
  formulacao: "multiclasse_softmax";
  limiares_triagem_validacao: Record<string, unknown> | null;
  notas_estudo: string;
  protocolo_feedback: string;
  corpus_feedback_aceite: Record<string, number>;
}

export interface FicheiroImagem {
  uri: string;
  name: string;
  type: "image/jpeg" | "image/png";
}
