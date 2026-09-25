import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pause, Play, Square, Flame, Trophy, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { useThemeStore } from '@/store/themeStore';
import { addFocusTime, getUsageLogs, addZenPoints } from '@/db/database';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

export default function FocusScreen() {
  const { theme } = useThemeStore();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [baseSeconds, setBaseSeconds] = useState(0); 
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [, setTicker] = useState(0); 

  const [viewDate, setViewDate] = useState(new Date());
  const [viewDateMinutes, setViewDateMinutes] = useState(0);

  const isViewDateToday = new Date().toISOString().split('T')[0] === viewDate.toISOString().split('T')[0];

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Fetch daily total from database whenever screen comes into focus or date changes
  useFocusEffect(
    React.useCallback(() => {
      const logs = getUsageLogs();
      const viewDateStr = viewDate.toISOString().split('T')[0];
      const viewLog = logs.find((l: any) => l.date === viewDateStr);
      setViewDateMinutes(viewLog?.focus_minutes || 0);
    }, [viewDate])
  );

  // Timer interval and Pulse Animation
  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTicker(t => t + 1); // Force re-render every second
      }, 1000);
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const currentSessionElapsed = isActive && sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
  const totalSessionSeconds = baseSeconds + currentSessionElapsed;
  const displayedTotalSeconds = (viewDateMinutes * 60) + (isViewDateToday ? totalSessionSeconds : 0);

  const prevDay = () => setViewDate(new Date(viewDate.getTime() - 86400000));
  const nextDay = () => setViewDate(new Date(viewDate.getTime() + 86400000));

  const toggleTimer = () => {
    if (!isActive) {
      // Start or Resume
      setSessionStartTime(Date.now());
      setIsActive(true);
    } else {
      // Pause
      setBaseSeconds(totalSessionSeconds);
      setSessionStartTime(null);
      setIsActive(false);
    }
  };

  const finishSession = () => {
    if (totalSessionSeconds > 0) {
      const minutesToLog = Math.floor(totalSessionSeconds / 60);
      if (minutesToLog > 0) {
        addFocusTime(minutesToLog);
        addZenPoints(minutesToLog);
        if (isViewDateToday) {
          setViewDateMinutes(prev => prev + minutesToLog);
        }
      }
    }
    // Reset session
    setBaseSeconds(0);
    setSessionStartTime(null);
    setIsActive(false);
  };

  const formatTime = (totalSecs: number, showHours: boolean = false) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    if (h > 0 || showHours) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeColor = isActive ? theme.secondary : theme.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.background, isActive ? `${theme.secondary}15` : `${theme.primary}10`]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        
        <View style={isLandscape ? styles.landscapeWrapper : styles.portraitWrapper}>
          
          {/* Main Timer Area */}
          <View style={[styles.timerSection, isLandscape && styles.timerSectionLandscape]}>
            <Animated.View 
              pointerEvents="none"
              style={[
                styles.glowCircle, 
                { backgroundColor: `${activeColor}20`, transform: [{ scale: pulseAnim }], zIndex: -1 }
              ]} 
            />
            <View style={[styles.timerCircle, { borderColor: `${activeColor}50`, backgroundColor: theme.card, zIndex: 10 }]}>
              <Text style={[styles.sessionLabel, { color: theme.textMuted }]}>
                {isActive ? 'FLOW STATE' : 'READY TO FOCUS'}
              </Text>
              <Text style={[styles.timeText, { color: theme.text, fontSize: isLandscape ? 64 : 72 }]}>
                {formatTime(totalSessionSeconds)}
              </Text>
              <Text style={[styles.sessionSub, { color: activeColor }]}>
                Current Session
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity 
                style={[styles.controlBtn, { backgroundColor: isActive ? `${theme.warning}20` : `${theme.primary}20` }]} 
                onPress={toggleTimer}>
                {isActive ? <Pause color={theme.warning} size={32} /> : <Play color={theme.primary} size={32} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
              
              {(totalSessionSeconds > 0 && !isActive) && (
                <TouchableOpacity 
                  style={[styles.controlBtn, { backgroundColor: `${theme.success}20`, marginLeft: spacing.lg }]} 
                  onPress={finishSession}>
                  <Square color={theme.success} size={28} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Motivation & Daily Stats Area */}
          <View style={[styles.statsSection, isLandscape && styles.statsSectionLandscape]}>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.motivationCard}
            >
              <Flame color="#FFF" size={32} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.motivationTitle}>Keep the momentum!</Text>
              <Text style={styles.motivationDesc}>
                {isActive 
                  ? "You're doing great. Stay focused and conquer your goals."
                  : "Tap play when you're ready to dive back into deep work."}
              </Text>
            </LinearGradient>

            <View style={[styles.dailyStatCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.statHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Trophy color={theme.warning} size={20} />
                  <Text style={[styles.statTitle, { color: theme.text }]}>Total Focus Time</Text>
                </View>
              </View>
              
              <View style={styles.statValueRow}>
                <TouchableOpacity onPress={prevDay} style={styles.dateChevron}>
                  <ChevronLeft color={theme.textMuted} size={36} />
                </TouchableOpacity>
                
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.statValue, { color: theme.text }]}>
                    {formatTime(displayedTotalSeconds, true)}
                  </Text>
                  <Text style={[styles.statSubtitle, { color: theme.textMuted }]}>
                    {isViewDateToday ? 'Today' : format(viewDate, 'MMMM d, yyyy')}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={nextDay} 
                  disabled={isViewDateToday}
                  style={[styles.dateChevron, { opacity: isViewDateToday ? 0.2 : 1 }]}
                >
                  <ChevronRight color={theme.textMuted} size={36} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  portraitWrapper: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  landscapeWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.5,
  },
  timerSectionLandscape: {
    flex: 1,
    paddingRight: spacing.xxl,
  },
  glowCircle: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  timerCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  sessionLabel: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.caption,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  timeText: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  sessionSub: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    marginTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    zIndex: 99,
    elevation: 99,
  },
  controlBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: spacing.lg,
  },
  statsSectionLandscape: {
    flex: 1,
    justifyContent: 'center',
  },
  motivationCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  motivationTitle: {
    color: '#FFF',
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.heading,
    marginBottom: spacing.xs,
  },
  motivationDesc: {
    color: '#FFF',
    opacity: 0.9,
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
    lineHeight: 22,
  },
  dailyStatCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statTitle: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.label,
  },
  statValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateChevron: {
    padding: spacing.sm,
  },
  statValue: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: 42,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.xs,
  },
  statSubtitle: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.caption,
  }
});
