// utils/notifications.js — Push notification setup and helpers
// Uses expo-notifications + Firebase Firestore to store tokens.
// Called once from App.js on mount after auth resolves.
//
// ─────────────────────────────────────────────────────────────────────────────
// CALL NOTIFICATION FORMAT (sent from admin panel or Cloud Functions):
//
//  Channel: research-calls (HIGH importance — heads-up banner)
//
//  STRUCTURE:
//  ┌─────────────────────────────────────────────────────┐
//  │ 📈 NEW CALL — RELIANCE  [BUY]                        │  ← title
//  │ Entry ₹2,450 · Target ₹2,600 · SL ₹2,380 | Equity  │  ← body
//  └─────────────────────────────────────────────────────┘
//
//  data payload: { screen: 'Calls', callId: '...', segment: '...', action: 'Buy'/'Sell' }
//
//  STATUS UPDATE FORMAT:
//  ┌─────────────────────────────────────────────────────┐
//  │ ✅ TARGET HIT — RELIANCE                             │
//  │ Equity call hit target ₹2,600. Profit booked.       │
//  └─────────────────────────────────────────────────────┘
//
//  EXPIRY REMINDER FORMAT:
//  ┌─────────────────────────────────────────────────────┐
//  │ ⏰ Subscription Expiring Soon                        │
//  │ Your Premium Index plan expires in 3 days.          │
//  └─────────────────────────────────────────────────────┘
//
//  HOW TO SEND FROM ADMIN (via Expo Push API):
//  POST https://exp.host/--/api/v2/push/send
//  {
//    "to": "<expo-push-token>",
//    "channelId": "research-calls",
//    "title": "📈 NEW CALL — RELIANCE [BUY]",
//    "body": "Entry ₹2,450 · Target ₹2,600 · SL ₹2,380 | Equity",
//    "data": { "screen": "Calls", "callId": "...", "action": "Buy" },
//    "sound": "default",
//    "priority": "high"
//  }
// ─────────────────────────────────────────────────────────────────────────────

import * as Notifications from 'expo-notifications';
import { savePushToken } from '../firebase';

// Show notifications in foreground (banner + sound)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,   // Show badge count on app icon
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build a well-formatted call notification payload
// Use this in your Cloud Function or admin tool when posting a new call.
//
// Example:
//   const payload = buildCallNotificationPayload({
//     stock: 'RELIANCE', action: 'Buy', segment: 'Equity',
//     buyPrice: 2450, target: 2600, stopLoss: 2380, callId: 'abc123'
//   });
// ─────────────────────────────────────────────────────────────────────────────
export function buildCallNotificationPayload({ stock, action, segment, buyPrice, target, stopLoss, callId }) {
  const actionEmoji = action === 'Buy' ? '📈' : '📉';
  const segShort    = segment || 'Equity';

  return {
    channelId: 'research-calls',
    title:     `${actionEmoji} NEW CALL — ${stock?.toUpperCase()}  [${action?.toUpperCase()}]`,
    body:      `Entry ₹${buyPrice} · Target ₹${target} · SL ₹${stopLoss}  |  ${segShort}`,
    data:      { screen: 'Calls', callId, segment, action },
    sound:     'default',
    priority:  'high',
  };
}

// Helper: Build a status update notification
export function buildStatusNotificationPayload({ stock, status, segment, target, stopLoss, callId }) {
  const statusEmoji = status === 'Target Hit' ? '✅' : status === 'SL Hit' ? '❌' : '🔔';
  const msg = status === 'Target Hit'
    ? `${segment} call hit target ₹${target}. Profit booked.`
    : status === 'SL Hit'
    ? `${segment} call hit stop loss ₹${stopLoss}. Exit recommended.`
    : `${segment} call status updated to ${status}.`;

  return {
    channelId: 'research-calls',
    title:     `${statusEmoji} ${status?.toUpperCase()} — ${stock?.toUpperCase()}`,
    body:      msg,
    data:      { screen: 'Calls', callId, status },
    sound:     'default',
    priority:  'high',
  };
}

/**
 * Request permission and register the device push token.
 * Call this once after the user is logged in.
 * Saves the token to Firestore so the admin can target it later.
 *
 * @param {string} uid — Firebase user UID
 */
export async function registerForPushNotifications(uid) {

  // Request permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    // User denied — silently skip. Don't block the app.
    return;
  }

  // Get the Expo push token
  try {
    // projectId is read from app.json automatically by Expo SDK 51+
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    if (token && uid) {
      await savePushToken(uid, token);
    }
  } catch (_e) {
    // Token fetch can fail on emulators — silently ignore
  }

  // Android notification channels
  // research-calls: HIGH importance — shows as heads-up banner with sound
  await Notifications.setNotificationChannelAsync('research-calls', {
    name:             'Research Calls',
    description:      'Live buy/sell calls from Dynamic Money Research',
    importance:       Notifications.AndroidImportance.HIGH,
    sound:            true,
    vibrationPattern: [0, 400, 200, 400],
    lightColor:       '#B48900',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd:        false,
  });
  // subscription: DEFAULT — plan renewals, expiry alerts
  await Notifications.setNotificationChannelAsync('subscription', {
    name:        'Subscription Alerts',
    description: 'Plan expiry and renewal reminders',
    importance:  Notifications.AndroidImportance.DEFAULT,
    sound:       true,
  });
  // general: LOW — app updates, non-urgent info
  await Notifications.setNotificationChannelAsync('general', {
    name:        'General Updates',
    description: 'App updates and announcements',
    importance:  Notifications.AndroidImportance.LOW,
    sound:       false,
  });
}

/**
 * Schedule a local notification for subscription expiry.
 * Call this when the user's plan expiry is set/renewed.
 *
 * @param {Date} expiryDate — plan expiry date
 * @param {string} planName — e.g. "Premium Index"
 */
export async function scheduleExpiryReminder(expiryDate, planName) {
  // Cancel existing expiry reminders first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const reminderDate = new Date(expiryDate);
  reminderDate.setDate(reminderDate.getDate() - 3); // 3 days before expiry

  if (reminderDate <= new Date()) return; // Already past — skip

  await Notifications.scheduleNotificationAsync({
    content: {
      title:    '⏰ Subscription Expiring Soon',
      body:     `Your ${planName} subscription expires in 3 days. Renew to keep receiving research calls.`,
      data:     { screen: 'Subscribe' },
      sound:    true,
    },
    trigger: { date: reminderDate },
  });
}

/**
 * Add a listener for notification taps.
 * Call in App.js to handle navigation when user taps a notification.
 *
 * @param {function} onTap — receives notification response
 * @returns cleanup function
 */
export function addNotificationTapListener(onTap) {
  const sub = Notifications.addNotificationResponseReceivedListener(onTap);
  return () => sub.remove();
}
