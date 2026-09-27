import { StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { FundoClinico } from "../components/FundoClinico";
import { Pulso } from "../components/Pulso";
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

export function RootNavigator() {
  const { pronto, onboardingVisto, autenticado, apdAceite } = useAuth();

  if (!pronto) {
    return (
      <FundoClinico>
        <View style={estilos.arranque}>
          <Pulso />
          <Text style={estilos.marca}>Maneco</Text>
        </View>
      </FundoClinico>
    );
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

const estilos = StyleSheet.create({
  arranque: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    gap: tema.espaco.lg,
  },
  marca: { color: tema.cores.texto, fontSize: tema.tipo.xl, fontWeight: "700" },
});
