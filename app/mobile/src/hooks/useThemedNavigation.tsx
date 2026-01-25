import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import useThemeColors from "@/contexts/ThemeColors";
import { useTheme } from "@/contexts/ThemeContext";

export default function useThemedNavigation() {
  const { theme } = useTheme();
  const colors = useThemeColors();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(colors.bg);
      NavigationBar.setButtonStyleAsync(theme === "dark" ? "light" : "dark");
    }
  }, [theme, colors.bg]);
  const ThemedStatusBar = () => (
    <StatusBar
      style={theme === "dark" ? "light" : "dark"}
      backgroundColor="transparent"
      translucent
    />
  );

  const screenOptions = {
    headerShown: false,
    backgroundColor: colors.bg,
    contentStyle: {
      backgroundColor: colors.bg,
    },
  };

  return {
    ThemedStatusBar,
    screenOptions,
    colors,
    theme,
  };
}
