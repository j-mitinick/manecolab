import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { tema } from "./src/theme/theme";

const navTema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: tema.cores.fundo,
    card: tema.cores.superficie,
    text: tema.cores.texto,
    primary: tema.cores.primario,
    border: tema.cores.linha,
    notification: tema.cores.alerta,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTema}>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
