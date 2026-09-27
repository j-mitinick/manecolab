import { useWindowDimensions } from "react-native";

import { tema } from "../theme/theme";

export function useLayoutClinico(): { tablet: boolean; largura: number } {
  const { width } = useWindowDimensions();
  return { tablet: width >= tema.breakpointTablet, largura: width };
}
