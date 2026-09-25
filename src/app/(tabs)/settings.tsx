import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
let Notifications: any = null;
// Notifications = require('expo-notifications');
console.log('expo-notifications bypassed for Expo Go compatibility');
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { getSetting, setSetting } from '@/db/database';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

export default function SettingsScreen() {
  const { theme, isDarkMode, setTheme } = useThemeStore();
  const { isAppLockEnabled, setAppLockEnabled, logout, user } = useAuthStore();
  const [reminders, setReminders] = useState(false);
  const [cloudSync, setCloudSync] = useState(false);

  React.useEffect(() => {
    setReminders(getSetting('reminders', 'false') === 'true');
    setCloudSync(getSetting('cloudSync', 'false') === 'true');
  }, []);

  const handleRemindersToggle = async (val: boolean) => {
    if (val) {
      if (Notifications) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Notification permission is required for reminders.');
          return;
        }
      } else {
        Alert.alert('Not supported', 'Notifications are not available in this preview environment.');
        return;
      }
    }
    setReminders(val);
    setSetting('reminders', val ? 'true' : 'false');
  };

  const handleCloudSyncToggle = (val: boolean) => {
    setCloudSync(val);
    setSetting('cloudSync', val ? 'true' : 'false');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        {/* FOCUS & NOTIFICATIONS */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>FOCUS & NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.row, styles.borderBottom, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Focus hours</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>9:00 AM – 5:00 PM</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>Task reminders</Text>
            <Switch
              value={reminders}
              onValueChange={handleRemindersToggle}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </View>

        {/* PRIVACY & SECURITY */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PRIVACY & SECURITY</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.row, styles.borderBottom, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>App Lock</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>Require PIN/Biometrics on app open</Text>
            </View>
            <Switch
              value={isAppLockEnabled}
              onValueChange={setAppLockEnabled}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
          <View style={[styles.row, styles.borderBottom, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Usage Access</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>Granted · Android only</Text>
            </View>
            <Text style={[styles.rowTitle, { color: theme.success }]}>ON</Text>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Cloud sync</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>Optional backup</Text>
            </View>
            <Switch
              value={cloudSync}
              onValueChange={handleCloudSyncToggle}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </View>

        {/* APPEARANCE */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.rowTitle, { color: theme.text, marginBottom: spacing.md }]}>Theme</Text>
          <View style={[styles.segmentedControl, { backgroundColor: theme.surface }]}>
            <TouchableOpacity 
              style={[styles.segmentButton, !isDarkMode && { backgroundColor: theme.card }]}
              onPress={() => setTheme(false)}>
              <Text style={[styles.segmentText, !isDarkMode ? { color: theme.primary } : { color: theme.textMuted }]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentButton, isDarkMode && { backgroundColor: theme.card }]}
              onPress={() => setTheme(true)}>
              <Text style={[styles.segmentText, isDarkMode ? { color: theme.primary } : { color: theme.textMuted }]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT */}
        <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: spacing.xl }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 100 }]}>
          <View style={[styles.row, styles.borderBottom, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Logged in as</Text>
              <Text style={[styles.rowSub, { color: theme.textMuted }]}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.row} onPress={logout}>
            <Text style={[styles.rowTitle, { color: theme.warning || '#EF4444' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  title: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.display,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  rowTitle: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
  },
  rowSub: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.caption,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    lineHeight: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: radius.sm,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentText: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.label,
  }
});
