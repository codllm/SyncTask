import "../global.css";
import { useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";

import { AppProvider, useApp } from "../context/AppContext";
import { SocketProvider } from "../context/SocketContext";
import { PushNotificationManager } from "../context/PushNotificationManager";

function RootLayoutContent() {
  const { token, loading, themeColor } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isAuthRoute =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/(auth)");

    if (token) {
      if (pathname === "/" || isAuthRoute) {
        router.replace("/(tabs)/home");
      }
    } else if (!isAuthRoute) {
      router.replace("/(auth)/login");
    }
  }, [loading, pathname, router, token]);

  if (loading) {
    return (
      <View className="flex-1 bg-dark-bg items-center justify-center" style={{ backgroundColor: "#0B0F19" }}>
        <ActivityIndicator size="large" color={themeColor} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <SocketProvider>
        <PushNotificationManager>
          <RootLayoutContent />
        </PushNotificationManager>
      </SocketProvider>
    </AppProvider>
  );
}
