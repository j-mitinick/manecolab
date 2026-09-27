# Maneco

Aplicação móvel de apoio à leitura de radiografia de tórax. Classifica uma imagem em quatro classes exclusivas — covid, pneumonia, tuberculose e normal — e mostra a confiança do ensemble oficial e, quando pedido, o mapa Grad-CAM.

O resultado é classificação assistida (CAD). Não é um diagnóstico e não substitui o clínico.

## Requisitos

- Node.js com npm
- [Expo Go](https://expo.dev/go) no telemóvel, ou um emulador Android / simulador iOS
- A API FastAPI do estudo a correr na mesma rede (porta 8000)

## Arranque

```bash
npm install
npx expo start
```

Copia `.env.example` para `.env` e define o endereço da API:

| Onde corre a app | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Emulador Android | `http://10.0.2.2:8000` |
| Simulador iOS | `http://127.0.0.1:8000` |
| Telemóvel na mesma Wi-Fi | `http://<IP-da-máquina>:8000` |

O ficheiro `.env` não entra no Git.

Na raiz do projecto da API (a pasta que contém o pacote `api`, não dentro dela):

```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

## Uso

As contas são criadas pelo administrador. A app só faz login.

1. Onboarding
2. Login
3. Aceitação do termo da APD (Lei n.º 22/11)
4. Leitura: galeria ou câmara, classificação, resultado do ensemble e dos modelos individuais
5. Histórico das predições desta conta, com a radiografia guardada
6. Perfil e, para radiologista ou administrador, ficha de treino

O parecer de rótulo (`classe_proposta`) só está disponível para radiologista e administrador. Fica pendente de revisão e não actualiza os pesos do modelo na hora.

## Verificação

```bash
npm run typecheck
```
