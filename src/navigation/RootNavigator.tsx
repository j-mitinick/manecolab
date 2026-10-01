import { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { EcraMarca } from "../components/EcraMarca";
import { useAuth } from "../context/AuthContext";
import { ConsentimentoAPDScreen } from "../screens/ConsentimentoAPDScreen";
import { DiagnosticoScreen } from "../screens/DiagnosticoScreen";
import { HistoricoScreen } from "../screens/HistoricoScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { TreinoScreen } from "../screens/TreinoScreen";
import { tema } from "../theme/theme";
import type { RotasApp } from "./tipos";

const Stack = createNativeStackNavigator<RotasApp>();
const SPLASH_MS = 1600;

export function RootNavigator() {
  const { pronto, onboardingVisto, autenticado, apdAceite } = useAuth();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const temporizador = setTimeout(() => setSplash(false), SPLASH_MS);
    return () => clearTimeout(temporizador);
  }, []);

  if (splash || !pronto) {
    return <EcraMarca legenda={splash ? null : "A carregar a aplicação"} />;
  }

  if (!onboardingVisto) {
    return <OnboardingScreen />;
  }
  if (!autenticado) {
    return <LoginScreen />;
  }
  if (!apdAceite) {
    return <ConsentimentoAPDScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName="Diagnostico"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tema.cores.fundo },
        animation: "fade_from_bottom",
        statusBarStyle: "light",
        statusBarTranslucent: true,
        statusBarBackgroundColor: "transparent",
      }}
    >
      <Stack.Screen name="Diagnostico" component={DiagnosticoScreen} />
      <Stack.Screen name="Historico" component={HistoricoScreen} />
      <Stack.Screen name="Treino" component={TreinoScreen} />
      <Stack.Screen name="Perfil" component={PerfilScreen} />
    </Stack.Navigator>
  );
}
