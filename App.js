// App.js — Dynamic Money App v3
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './components/AuthContext';
import { COLORS } from './components/theme';
import {
  registerForPushNotifications,
  addNotificationTapListener,
} from './utils/notifications';

import LoginScreen     from './screens/LoginScreen';
import RegisterScreen  from './screens/RegisterScreen';
import AgreementScreen from './screens/AgreementScreen';
import HomeScreen      from './screens/HomeScreen';
import CallsScreen     from './screens/CallsScreen';
import CallDetailScreen from './screens/CallDetailScreen';
import ArticlesScreen  from './screens/ArticlesScreen';
import WhatsAppScreen  from './screens/WhatsAppScreen';
import SettingsScreen  from './screens/SettingsScreen';
import SubscribeScreen from './screens/SubscribeScreen';
import AdminScreen     from './screens/admin/AdminScreen';

SplashScreen.preventAutoHideAsync();

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── LOADING ──────────────────────────────────────────────────────────────
function AppSplash() {
  return (
    <View style={s.splash}>
      <View style={s.splashIcon}>
        <Ionicons name="trending-up" size={36} color={COLORS.gold} />
      </View>
      <Text style={s.splashTitle}>DYNAMIC MONEY</Text>
      <Text style={s.splashSub}>Research Advisory</Text>
      <ActivityIndicator color={COLORS.gold} style={{ marginTop: 32 }} />
    </View>
  );
}

// ── AUTH STACK ────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ── SHARED TAB ICONS ──────────────────────────────────────────────────────
const TAB_ICONS = {
  Home:       ['home',         'home-outline'],
  Calls:      ['trending-up',  'trending-up-outline'],
  Articles:   ['newspaper',    'newspaper-outline'],
  WhatsApp:   ['logo-whatsapp','logo-whatsapp'],
  Settings:   ['person',       'person-outline'],
  AdminPanel: ['shield-checkmark', 'shield-checkmark-outline'],
};

// ── ADMIN NAVIGATOR ───────────────────────────────────────────────────────
// Admin gets a dedicated full-screen panel — no user screens mixed in
function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminPanel" component={AdminScreen} />
    </Stack.Navigator>
  );
}

// ── USER MAIN NAVIGATOR ───────────────────────────────────────────────────
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarActiveTintColor:   COLORS.navy,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: s.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen} />
      <Tab.Screen name="Calls"    component={CallsScreen} />
      <Tab.Screen name="Articles" component={ArticlesScreen} />
      <Tab.Screen name="WhatsApp" component={WhatsAppScreen}
        options={{
          tabBarLabel: 'Support',
          tabBarIcon: ({ focused, color, size }) =>
            <Ionicons name="logo-whatsapp" size={size} color={focused ? '#16a34a' : COLORS.textMuted} />,
        }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Account' }} />
    </Tab.Navigator>
  );
}

// ── ROOT NAVIGATOR ────────────────────────────────────────────────────────
function RootNavigator() {
  const { user, profile, loading, isAdmin, hasAgreed } = useAuth();

  useEffect(() => {
    // Only hide native splash if fully loaded OR if no user is logged in
    if (!loading && (!user || profile !== undefined)) {
      SplashScreen.hideAsync();
    }
  }, [loading, user, profile]);

  // CRITICAL FIX: Wait for both user AND profile to load before transitioning
  if (loading || (user && profile === undefined)) return <AppSplash />;
  
  if (!user)   return <AuthStack />;
  if (isAdmin) return <AdminNavigator />;

  if (user && profile && !hasAgreed) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Agreement" component={AgreementScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"       component={MainNavigator} />
      <Stack.Screen name="CallDetail" component={CallDetailScreen} />
      <Stack.Screen name="Subscribe"  component={SubscribeScreen}
        options={{ presentation: 'modal', animationEnabled: true }} />
      <Stack.Screen name="Agreement"  component={AgreementScreen}
        options={{ presentation: 'modal', animationEnabled: true }} />
    </Stack.Navigator>
  );
}

export const navigationRef = React.createRef();

function NotificationHandler() {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user || isAdmin) return;
    registerForPushNotifications(user.uid);
    const cleanup = addNotificationTapListener((response) => {
      const screen = response.notification.request.content.data?.screen;
      if (screen && navigationRef.current?.isReady?.()) {
        navigationRef.current.navigate(screen);
      }
    });
    return cleanup;
  }, [user, isAdmin]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <NotificationHandler />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  splash: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.navyDark, gap: 8,
  },
  splashIcon: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: 'rgba(180,137,0,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(180,137,0,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  splashTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  splashSub:   { fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' },
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor:  COLORS.border,
    borderTopWidth:  1,
    height:          72,
    paddingBottom:   10,
    paddingTop:      8,
    elevation:       8,
  },
  tabLabel: { fontSize: 10, fontWeight: '700' },
});