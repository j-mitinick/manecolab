# Prompt — App móvel Maneco (React Native + TypeScript)

Copia este documento na íntegra para um agente ou engenheiro. É a especificação de implementação, já alinhada com a API FastAPI real do estudo (pasta `project/api`). **Não inventes endpoints, campos JSON nem fluxos de cadastro.**

---

Atua como **Engenheiro Mobile Líder** e especialista em **React Native com TypeScript**. Gera a estrutura completa e o código de uma aplicação móvel (smartphones e tablets) que serve de interface CAD — classificação assistida de radiografia de tórax — para uma equipa clínica.

Isto é **apoio à leitura, não um diagnóstico médico autónomo**. A app consome a API FastAPI do estudo. Escreve código real, modular e compilável. Não uses placeholders vazios (`TODO`, `// implement later`).

## 0. Regras que o prompt original errava (obrigatório corrigir)

A API **não** é multi-rótulo. A softmax tem **exactamente uma** de quatro classes exclusivas:

`covid` | `pneumonia` | `tuberculose` | `normal`

| Ideia do prompt antigo | Realidade da API |
|---|---|
| Campo `diagnostico_ensemble` | `ensemble_oficial` (`classe_predita`, `confianca`, `probabilidades`) |
| Flag `alerta_clinico` por doença | Um único booleano `alerta_incerteza` (confiança do ensemble oficial < 0,50) |
| `POST /feedback` | `POST /predicoes/{predicao_id}/feedback` |
| Checkboxes de várias patologias em simultâneo | **Uma** `classe_proposta` (radio / select). Nunca envies um array de doenças. |
| Médico dá o rótulo de ouro | Só `radiologista` e `admin` podem submeter feedback. `medico` usa o CAD e **não** chama o endpoint de feedback. |
| Auto-registo na app | **Proibido.** As contas são criadas só pelo administrador (dashboard web / `POST /admin/utilizadores`). A app só faz **login**. |
| Treino online após feedback | O feedback fica `pendente` no servidor. A app **não** espera que o modelo mude. |

`visualizacao_xai` é um dicionário `{ [classe]: string }` em que cada valor **já é um data URI** (`data:image/png;base64,...`). Usa-o directamente em `<Image source={{ uri }} />`. Não prefixes `data:image` outra vez.

---

## 1. Contexto do produto

Nome de trabalho: **Maneco**. Público: médicos, radiologistas e administradores previamente cadastrados. Dispositivos: telemóvel (coluna única + `ScrollView`) e tablet (split view no ecrã de inferência).

A API corre na LAN, tipicamente:

```text
http://<IP-LAN>:8000
```

Emulador Android: `http://10.0.2.2:8000`. iOS Simulator: `http://127.0.0.1:8000`. Configura `EXPO_PUBLIC_API_URL` (ou equivalente) em `.env`. Timeout Axios: **120 s** no `POST /predict` (os quatro CNN + Grad-CAM são lentos em CPU); 15 s nos restantes.

Arranque da API (raiz `project/`, não dentro de `api/`):

```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

Público sem JWT: `GET /health`, `POST /auth/login`. Tudo o resto exige `Authorization: Bearer <access_token>`.

---

## 2. Arquitectura e boas práticas

- TypeScript estrito. Interfaces 1:1 com o JSON da API (secção 8).
- Pastas: `src/components`, `src/screens`, `src/services`, `src/theme`, `src/hooks`, `src/navigation`, `src/types`, `src/storage`, `src/context`.
- Componentes funcionais; estado com `useState`, `useEffect`, `useMemo`, `useCallback`. Contexto de sessão (`AuthProvider`) + `SecureStore` (token) e `AsyncStorage` (onboarding + APD).
- Navegação: `@react-navigation/native` + native-stack. **Navegação condicional** por três flags: `onboardingVisto`, `autenticado`, `apdAceite`.
- Tema centralizado em `src/theme/theme.ts` (constantes, sem números mágicos nos ecrãs).
- Axios isolado em `src/services/api.ts` (interceptor Bearer, 401 → logout, erros amigáveis).
- Selecção de imagem: `expo-image-picker` (galeria) e câmara se as permissões existirem. Envio **multipart** campo `file` (JPEG/PNG). Não normalizes pixéis no cliente: a API espera a imagem original; o preprocess 380×380 RGB 0–255 é servidor.

Paleta clínica (`theme.ts`):

- Fundo de app: `#0E141B` / superfície `#171E27`
- Fundo do visualizador CXR: `#000000`
- Primário (azul médico): `#1B6CA8`
- Texto: `#E8EEF5` / muted `#8A9BB0`
- Sucesso: `#067647`
- Alerta de incerteza (laranja): `#C05621`
- Crítico / erro (vermelho): `#B42318`
- Acento teal (acções secundárias): `#0F7A74`
- Tipografia: 12 / 14 / 16 / 20 / 24; espaçamentos 4 / 8 / 12 / 16 / 24 / 32
- Raios 10–16

Copia o tom da consola web (`api/templates/dashboard.html` + `api/static/dashboard.css`) sem a clonar: é uma app clínica, não um dashboard admin.

---

## 3. Autenticação — só login, nunca cadastro

Não existe ecrã de “Criar conta”, “Registar” nem “Esqueci a senha” que chame a API para criar utilizadores. Se a pessoa não tem conta, mostra:

> “A sua conta é criada pelo administrador da unidade. Contacte o responsável se não conseguir entrar.”

Fluxo HTTP:

1. `POST /auth/login` body JSON `{ "email": string, "senha": string }`
2. Resposta `TokenResposta`: guarda `access_token` (SecureStore) e `utilizador` (contexto).
3. `GET /auth/me` ao arranque se já houver token (restauro de sessão).
4. Logout: apaga o token e o utilizador em memória; **não** apagues o aceite APD nem o onboarding (são do dispositivo).
5. Opcional no ecrã de perfil: `POST /auth/senha` `{ "senha_atual", "senha_nova" }` (mín. 8). Após sucesso, o servidor invalida o token — força novo login.

Erros a mapear:

- `401` login → “Email ou senha incorrectos.”
- `403` “Conta bloqueada.” → não deixar tentar o predict.
- `401` em pedido autenticado → sessão expirada, voltar ao Login.

Papéis `UtilizadorPublico.funcao`:

| Papel | Upload / predict | Feedback clínico | Ver ficha de treino (`GET /modelos/treino`) |
|---|---|---|---|
| `medico` | Sim | **Não** (esconde a secção) | Não |
| `radiologista` | Sim | Sim | Sim (ecrã opcional) |
| `admin` | Sim | Sim | Sim |

`nivel_experiencia` (`junior` \| `pleno` \| `senior`) só informa o peso no servidor. A app pode mostrar um aviso ao júnior: o parecer fica pendente e pesa 0,25.

---

## 4. Navegação condicional e compliance

Ordem obrigatória. Quem saltar um passo **não** chega ao upload.

```
[primeiro arranque] → Onboarding
[onboarding visto, sem token] → Login
[token OK, APD não aceite neste dispositivo] → Termo APD
[token OK + APD aceite] → App (Upload / Resultado)
```

Persistência local (AsyncStorage):

- `@maneco/onboarding_visto` = `"1"`
- `@maneco/apd_aceite` = `"1"` (dispositivo; não é por utilizador no servidor)

### 4.1 Onboarding (só a primeira vez na app)

Carrossel de **3** páginas, botão “Começar” na última (e “Seguinte” nas outras):

1. Triagem CAD de CXR para covid, pneumonia, tuberculose e normal.
2. Ensemble oficial (ResNet50V2 + DenseNet121 + EfficientNetB4) e mapas Grad-CAM.
3. Contas pré-criadas pelo admin; resultado **não** substitui o clínico; correlacionar com exames.

### 4.2 Login

Email + palavra-passe. Botão “Entrar” com spinner. Sem link de registo. Após 200, se APD não estiver aceite → Termo; senão → App.

### 4.3 Termo de Consentimento e Proteção de Dados (APD Angola)

Obrigatório no **primeiro login bem-sucedido neste dispositivo**. Trava o stack: não há back para o Upload.

Texto (podes redigir formalmente, mas **cita explicitamente**):

- Lei da Proteção de Dados Pessoais de Angola (**Lei n.º 22/11**)
- Diretrizes da **APD** (Agência de Proteção de Dados)
- Finalidade: triagem assistida de imagem, não diagnóstico autónomo
- Confidencialidade, minimização e, sempre que possível, **anonimização / pseudonimização** dos dados clínicos
- A imagem e o parecer ficam no servidor da unidade para auditoria e corpus de re-treino **offline** revisto por administrador
- O utilizador é responsável por não fotografar identificadores do paciente no ficheiro enviado

UI: checkbox **desmarcada** por defeito (“Li e aceito o tratamento de dados nos termos da Lei n.º 22/11 e da APD”). O botão **“Aceitar e Continuar”** só activa com a checkbox. Ao aceitar, grava AsyncStorage e navega para a App.

Se o utilizador recusar: Logout e regresso ao Login. Sem aceite, o botão de upload no ecrã seguinte permanece `disabled` (defesa em profundidade, mesmo que a navegação falhe).

### 4.4 App autenticada

Header com nome (`primeiro_nome ultimo_nome`), badge da `funcao`, **Logout** visível. Logout limpa só a sessão (token + user).

---

## 5. Ecrã de Upload e classificação (core)

Acessível só com token + APD. Caso contrário, upload desactivado e mensagem “Aceite o termo da APD para classificar imagens.”

Controlos:

- Escolher imagem (galeria / câmara)
- Preview da CXR em fundo preto
- Switch “Incluir Grad-CAM” (default **ligado** → `incluir_xai=true`)
- Botão “Classificar” → `POST /predict?incluir_xai=true|false` com `FormData` campo `file`
- Loading bloqueante (“A inferir o ensemble… pode demorar”)
- `nota_clinica` e `protocolo_feedback` da resposta: mostra-os como aviso permanente, não os ignores

Guarda a resposta completa + `predicao_id` no estado do ecrã / store de resultado.

### Layout

- **Smartphone** (`useWindowDimensions` width < 768): coluna, `ScrollView` (imagem → barras → XAI → validação).
- **Tablet** (≥ 768): duas colunas — esquerda visualizador + abas XAI; direita barras, notas e validação.

---

## 6. Resultados — ensemble oficial

Consome **`ensemble_oficial.probabilidades`**, não `ensemble_4_cnn` (este último é só comparação; podes mostrar num acordeão “Detalhe técnico”).

Barras independentes 0–100 % para `covid`, `pneumonia`, `tuberculose`, `normal` (probabilidade × 100). Destaca `ensemble_oficial.classe_predita` e mostra `confianca`.

Se `alerta_incerteza === true`: banner laranja/vermelho *“Confiança do ensemble abaixo de 50 %. Correlacionar com clínica.”* e contorno laranja na barra da classe prevista. **Não** existe alerta por doença no JSON.

Opcional: quatro mini-barras por CNN em `probabilidades_individuais` (`vgg16`, `resnet50v2`, `densenet121`, `efficientnetb4`).

---

## 7. XAI (Grad-CAM)

`visualizacao_xai` só vem com chaves pedidas (por defeito a classe argmax). Abas/botões **apenas para as chaves presentes**. Clique na aba “Covid-19” → `<Image>` principal usa `visualizacao_xai.covid`. O mesmo para pneumonia, tuberculose e normal.

Se `incluir_xai` foi false ou o mapa falhou, mostra a imagem original e “Mapa de calor indisponível”.

---

## 8. Validação médica (feedback) — contrato real

Endpoint:

```http
POST /predicoes/{predicao_id}/feedback
Authorization: Bearer <token>
Content-Type: application/json

{ "classe_proposta": "covid" | "pneumonia" | "tuberculose" | "normal", "comentario": "opcional" }
```

- Um parecer por utilizador por predição (`409` se repetir).
- Resposta inclui `estado: "pendente"`, `peso`, `aviso_proteccao`.
- **Não** actualiza o `.keras`. Toast de sucesso:

  > “Feedback enviado com sucesso. Obrigado por contribuir para a melhoria contínua do modelo. O parecer ficou pendente de revisão do administrador.”

Visível só se `funcao` ∈ {`radiologista`, `admin`} **e** existir `predicao_id`. Médico: texto “A validação de rótulo para o corpus é feita pelo radiologista.”

### 8.1 Confirmar classificação da IA

Envia `classe_proposta` **igual** a `ensemble_oficial.classe_predita`. Comentário opcional.

### 8.2 Corrigir classificação

**Não uses checkboxes multi-doença.** Modal com **quatro radios** (uma classe). “Enviar correção” → mesmo POST com a classe escolhida. Se for igual à da IA, trata como confirmação.

Após 201, desactiva os dois botões nessa predição.

---

## 9. Tipos TypeScript (copia fiel)

```ts
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
```

---

## 10. Serviços Axios (`src/services/api.ts`)

| Método | Caminho | Auth | Uso na app |
|---|---|---|---|
| GET | `/health` | Não | Banner “API indisponível” no Login |
| POST | `/auth/login` | Não | Login |
| GET | `/auth/me` | Sim | Hidratar sessão |
| POST | `/auth/senha` | Sim | Perfil |
| POST | `/predict?incluir_xai=` | Sim | Core |
| POST | `/predicoes/{id}/feedback` | Sim | Validação (radio/admin) |
| GET | `/predicoes` | Sim | Histórico opcional |
| GET | `/modelos/treino` | Sim | Só radio/admin, ecrã opcional |

Não implements na app: CRUD de utilizadores, revisão de feedback, export de corpus. Isso é o dashboard web do admin.

Interceptor: inj<ecta Bearer; em 401 (excepto login) faz logout. Erros de rede: Alert “Sem ligação ao servidor. Confirme o IP da API e a mesma rede Wi-Fi.” Timeout do predict: mensagem de espera, não um crash.

---

## 11. Ecrãs a gerar (lista fechada)

1. `OnboardingScreen`
2. `LoginScreen`
3. `ConsentimentoAPDScreen`
4. `DiagnosticoScreen` (upload + resultado + XAI + validação)
5. `PerfilScreen` (nome, função, alterar senha, logout) — opcional mas recomendado
6. `HistoricoScreen` — opcional (`GET /predicoes`)
7. `RootNavigator` com os gates da secção 4

Componentes: `BarraProbabilidade`, `VisualizadorCXR`, `AbasXAI`, `ValidacaoMedica`, `BadgeFuncao`, `BannerIncerteza`, `BotaoPrimario`.

---

## 12. Segurança e copy clínica

- Nunca hardcodes o JWT.
- HTTPS quando existir; em LAN HTTP é aceitável em desenvolvimento.
- Não envies metadados EXIF extra; o picker pode mandar o ficheiro tal qual.
- Em todos os ecrãs de resultado, mantém visível que **não é diagnóstico**.
- Português de Angola / Portugal (palavra-passe, utilizador, classificação).

---

## 13. Critérios de aceitação

- [ ] Sem ecrã nem endpoint de auto-registo.
- [ ] Onboarding só no 1.º arranque; APD só até aceitar neste dispositivo.
- [ ] Upload `disabled` sem token ou sem APD.
- [ ] Login via `POST /auth/login`; Bearer em todos os pedidos protegidos.
- [ ] Resultados lêem `ensemble_oficial` + `alerta_incerteza`.
- [ ] XAI troca o `<Image>` pelas chaves reais de `visualizacao_xai`.
- [ ] Feedback: um único `classe_proposta` em `POST /predicoes/{id}/feedback`.
- [ ] Médico não vê / não chama feedback.
- [ ] Tablet split view; telemóvel coluna + scroll.
- [ ] Logout visível; 401 devolve ao Login.
- [ ] Tipos TypeScript iguais ao JSON da API.

Gera o projecto Expo (SDK recente) + TypeScript, `app.json` com nome **Maneco**, e o código completo dos ecrãs, serviços, tema e navegação. Não deixes ficheiros vazios.
