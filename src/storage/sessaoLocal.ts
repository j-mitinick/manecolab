import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { CHAVE_APD, CHAVE_ONBOARDING, CHAVE_TOKEN, VALOR_VISTO } from "./chaves";

async function guardarSegredo(chave: string, valor: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(chave, valor);
    return;
  }
  await SecureStore.setItemAsync(chave, valor);
}

async function lerSegredo(chave: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(chave);
  }
  return SecureStore.getItemAsync(chave);
}

async function apagarSegredo(chave: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.removeItem(chave);
    return;
  }
  await SecureStore.deleteItemAsync(chave);
}

export async function guardarToken(token: string): Promise<void> {
  await guardarSegredo(CHAVE_TOKEN, token);
}

export async function lerToken(): Promise<string | null> {
  return lerSegredo(CHAVE_TOKEN);
}

export async function apagarToken(): Promise<void> {
  await apagarSegredo(CHAVE_TOKEN);
}

export async function lerOnboardingVisto(): Promise<boolean> {
  const valor = await AsyncStorage.getItem(CHAVE_ONBOARDING);
  return valor === VALOR_VISTO;
}

export async function marcarOnboardingVisto(): Promise<void> {
  await AsyncStorage.setItem(CHAVE_ONBOARDING, VALOR_VISTO);
}

export async function lerApdAceite(): Promise<boolean> {
  const valor = await AsyncStorage.getItem(CHAVE_APD);
  return valor === VALOR_VISTO;
}

export async function marcarApdAceite(): Promise<void> {
  await AsyncStorage.setItem(CHAVE_APD, VALOR_VISTO);
}
