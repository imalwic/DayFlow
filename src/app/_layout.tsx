import { useFonts, Poppins_600SemiBold, Poppins_500Medium } from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useMotivationStore } from '@/store/motivationStore';
import { initDB, setCurrentUserId } from '@/db/database';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSegments } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
let Notifications: any = null;
// Notifications = require('expo-notifications');
console.log('expo-notifications bypassed for Expo Go compatibility');
import { View, Text, TouchableOpacity, StyleSheet, AppState, AppStateStatus, Platform } from 'react-native';
import { Lock } from 'lucide-react-native';

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance?.MAX || 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    }).catch(() => {});
  }
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_600SemiBold,
    Poppins_500Medium,
  });
  
  const { isDarkMode, theme } = useThemeStore();
  const { loadTasks } = useTaskStore();
  const { loadStreak } = useMotivationStore();
  const { user, isLoading, checkAuth, isAppLockEnabled, appLocked, setAppLocked } = useAuthStore();
  
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Initialize Database
    initDB();
    
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);
  
  // Auth Routing Logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user) {
      setCurrentUserId(user.id);
      loadTasks();
      loadStreak();
      if (inAuthGroup) {
        router.replace('/');
      }
    }
  }, [user, isLoading, segments]);

  // AppState Listener for App Lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAppLockEnabled && user) {
        setAppLocked(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAppLockEnabled, user]);
  
  const handleUnlock = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock DayFlow',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) {
        setAppLocked(false);
      }
    } else {
      // If no hardware, just unlock
      setAppLocked(false);
    }
  };

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="add-task" 
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'New Task',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
      </Stack>
      
      {user && appLocked && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', zIndex: 9999 }]}>
          <Lock color={theme.primary} size={64} style={{ marginBottom: 24 }} />
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 24, color: theme.text, marginBottom: 8 }}>App Locked</Text>
          <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 16, color: theme.textMuted, marginBottom: 32 }}>Verify your identity to continue</Text>
          <TouchableOpacity 
            style={{ backgroundColor: theme.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 }}
            onPress={handleUnlock}
          >
            <Text style={{ color: '#FFF', fontFamily: 'Poppins_600SemiBold', fontSize: 16 }}>Unlock Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </GestureHandlerRootView>
  );
}
