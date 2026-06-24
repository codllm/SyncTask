import { Expo } from "expo-server-sdk";
import UserModel from "../model/user.model";

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send a push notification to all registered tokens of a recipient user
 */
export const sendPushNotification = async (
  recipientId: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    const user = await UserModel.findById(recipientId);
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`PushService: User ${recipientId} has no registered push tokens.`);
      return;
    }

    console.log(`PushService: Sending push notification to user ${recipientId} on ${user.pushTokens.length} token(s)`);

    const messages: any[] = [];
    for (const pushToken of user.pushTokens) {
      // Validate that this is a correct Expo push token
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`PushToken ${pushToken} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: pushToken,
        sound: "default",
        title: title,
        body: body,
        data: data || {},
      });
    }

    if (messages.length === 0) return;

    // Chunk the push notifications to comply with Expo guidelines
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log("PushService: Sent chunk of push notifications successfully");
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("PushService: Error sending notification chunk:", error);
      }
    }
  } catch (error) {
    console.error("PushService: Failed to send push notification:", error);
  }
};
