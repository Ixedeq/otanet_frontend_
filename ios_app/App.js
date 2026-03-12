import React, { useState, useEffect, useCallback } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import Navigation from "./src/navigation/Navigation";
import AnimatedSplash from "./src/components/SplashScreen";

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide native splash immediately to show our animated one
        await SplashScreen.hideAsync();

        // Show animated splash for a minimum time
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        // Small delay before hiding animated splash for smooth transition
        setTimeout(() => setShowAnimatedSplash(false), 300);
      }
    }

    prepare();
  }, []);

  if (showAnimatedSplash) {
    return <AnimatedSplash />;
  }

  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}
