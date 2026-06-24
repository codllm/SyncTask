import React, { useEffect, useState, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useApp } from "./AppContext";
import { registerPushToken, removePushToken } from "../api/push.api";

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register device for remote push notifications and return the Expo Push Token
 */
async function registerForPushNotificationsAsync() {
  let token = null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("Failed to get push token for push notifications (permission denied)!");
      return null;
    }

    // Get EAS project ID
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = tokenData.data;
      console.log("PushNotificationManager: Expo Push Token fetched:", token);
    } catch (error) {
      console.error("PushNotificationManager: Error fetching Expo push token:", error);
    }
  } else {
    console.log("PushNotificationManager: Must use a physical device for Push Notifications");
  }

  return token;
}

export function PushNotificationManager({ children }: { children: React.ReactNode }) {
  const { user, token } = useApp();
  const [devicePushToken, setDevicePushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // 1. If logged in, fetch and register token
    if (user && token) {
      registerForPushNotificationsAsync().then((pushToken) => {
        if (pushToken) {
          registerPushToken(pushToken)
            .then((res) => {
              if (res.success) {
                setDevicePushToken(pushToken);
                console.log("PushNotificationManager: Token registered successfully on backend");
              }
            })
            .catch((err) => {
              console.error("PushNotificationManager: Failed to register token on backend", err);
            });
        }
      });
    }

    // 2. Setup notification listeners (useful for foreground reception & tapping alerts)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("PushNotificationManager: Foreground notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("PushNotificationManager: User tapped push notification:", response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?._id, token]); // Run when user logs in/out

  // Handle logout unregistration
  useEffect(() => {
    if (!token && devicePushToken) {
      console.log("PushNotificationManager: Logging out, removing token:", devicePushToken);
      removePushToken(devicePushToken)
        .then(() => {
          console.log("PushNotificationManager: Token removed successfully from backend");
          setDevicePushToken(null);
        })
        .catch((err) => {
          console.error("PushNotificationManager: Failed to remove token from backend", err);
          setDevicePushToken(null);
        });
    }
  }, [token]);

  return <>{children}</>;
}
