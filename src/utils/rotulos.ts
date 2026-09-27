import type { ClasseNome, EstadoFeedback, FuncaoNome, NivelExperiencia, SoftmaxClasses } from "../types/api";

export const CLASSES: ClasseNome[] = ["covid", "pneumonia", "tuberculose", "normal"];

export const ROTULO_CLASSE: Record<ClasseNome, string> = {
  covid: "Covid-19",
  pneumonia: "Pneumonia",
  tuberculose: "Tuberculose",
  normal: "Normal",
};

export const ROTULO_FUNCAO: Record<FuncaoNome, string> = {
  medico: "Médico",
  radiologista: "Radiologista",
  admin: "Administrador",
};

export const ROTULO_NIVEL: Record<NivelExperiencia, string> = {
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sénior",
};

export const ROTULO_ESTADO: Record<EstadoFeedback, string> = {
  pendente: "Pendente",
  aceite: "Aceite",
  rejeitado: "Rejeitado",
};

export const MODELOS_XAI = ["resnet50v2", "densenet121", "efficientnetb4", "vgg16"] as const;
export const MODELO_XAI_PADRAO: (typeof MODELOS_XAI)[number] = "resnet50v2";

export const ROTULO_CNN: Record<string, string> = {
  vgg16: "VGG16",
  resnet50v2: "ResNet50V2",
  densenet121: "DenseNet121",
  efficientnetb4: "EfficientNetB4",
};

export function rotuloCnn(nome: string): string {
  return ROTULO_CNN[nome] ?? nome;
}

export function percentagem(valor: number): string {
  return `${(valor * 100).toFixed(1).replace(".", ",")} %`;
}

export function numeroPt(valor: number): string {
  return String(valor).replace(".", ",");
}

export function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) {
    return iso;
  }
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()} ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

export function podeSubmeterFeedback(funcao: FuncaoNome): boolean {
  return funcao === "radiologista" || funcao === "admin";
}

export function podeVerTreino(funcao: FuncaoNome): boolean {
  return funcao === "radiologista" || funcao === "admin";
}

export function classeMaisProvavel(probs: SoftmaxClasses): ClasseNome {
  return CLASSES.reduce((melhor, classe) => (probs[classe] > probs[melhor] ? classe : melhor), CLASSES[0]);
}
