import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemeProvider } from "@/contexts/ThemeContext";
import useThemedNavigation from "@/hooks/useThemedNavigation";
import "@/styles/global.css";

export default function RootLayout() {
  const { screenOptions } = useThemedNavigation();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={screenOptions} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
