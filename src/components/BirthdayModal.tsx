import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { CalendarHeart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

export default function BirthdayModal() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkBirthday = async () => {
      if (!user?.birthday) return;

      const today = new Date();
      const todayStr = `${today.getMonth() + 1}-${today.getDate()}`; // MM-DD
      
      const bday = new Date(user.birthday);
      const bdayStr = `${bday.getMonth() + 1}-${bday.getDate()}`; // MM-DD
      
      if (todayStr === bdayStr) {
        const lastShown = await AsyncStorage.getItem('lastBirthdayShownYear');
        const currentYear = today.getFullYear().toString();
        
        if (lastShown !== currentYear) {
          setVisible(true);
          await AsyncStorage.setItem('lastBirthdayShownYear', currentYear);
        }
      }
    };
    
    checkBirthday();
  }, [user]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <CalendarHeart color={theme.primary} size={64} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: theme.text }]}>Happy Birthday!</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Wishing you a fantastic day, {user?.firstName}! 🎉 Let's crush some goals today.
          </Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.buttonText}>Thank You!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.display,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.label,
  }
});
