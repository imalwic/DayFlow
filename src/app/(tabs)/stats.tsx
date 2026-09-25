import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useMotivationStore } from '@/store/motivationStore';
import { getUsageLogs, UsageLog, getZenPoints } from '@/db/database';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { subDays, format } from 'date-fns';

export default function StatsScreen() {
  const { theme } = useThemeStore();
  const { tasks } = useTaskStore();
  const { streak } = useMotivationStore();
  
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [zenPoints, setZenPoints] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      setLogs(getUsageLogs());
      setZenPoints(getZenPoints());
    }, [])
  );

  // Calculate stats for current week (last 7 days including today)
  const today = new Date();
  const past7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));
  
  const weekLogs = past7Days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const log = logs.find(l => l.date === dateStr);
    return {
      day: format(day, 'EEEEEE'), // Mo, Tu, We...
      focus_minutes: log?.focus_minutes || 0,
      distracted_minutes: log?.distracted_minutes || 0,
    };
  });

  const totalFocusMinutes = weekLogs.reduce((sum, log) => sum + log.focus_minutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  
  const totalDistractedMinutes = weekLogs.reduce((sum, log) => sum + log.distracted_minutes, 0);
  const totalDistractedHours = (totalDistractedMinutes / 60).toFixed(1);
  
  const totalTasksDone = tasks.filter(t => t.isCompleted).length; // Overall, or we can filter by week

  // Find max for chart scaling
  const maxFocus = Math.max(...weekLogs.map((l: any) => l.focus_minutes), 1); // min 1 to avoid / 0

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>This week</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: theme.border }]}>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>{totalTasksDone}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Tasks done</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: theme.border }]}>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>{totalFocusHours}h</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Focus time</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: theme.border }]}>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>{streak}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Day streak</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>REWARDS</Text>
        <View style={[styles.summaryCard, { borderColor: theme.border, marginBottom: spacing.xxl, padding: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Total Earned</Text>
            <Text style={[styles.summaryValue, { color: theme.secondary, fontSize: 32 }]}>{zenPoints}</Text>
          </View>
          <Text style={[styles.summaryLabel, { color: theme.primary, fontFamily: typography.fonts.poppinsSemiBold }]}>
            ZEN POINTS 🧘‍♂️
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>TASKS COMPLETED</Text>
        
        {/* Simple Bar Chart */}
        <View style={styles.chartContainer}>
          {weekLogs.map((data, index) => {
            const heightPercent = (data.focus_minutes / maxFocus) * 100;
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={[styles.barBackground, { backgroundColor: theme.surface }]}>
                  <LinearGradient
                    colors={[theme.primary, theme.secondary]}
                    style={[styles.barFill, { height: `${heightPercent}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme.textMuted }]}>{data.day.charAt(0)}</Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>FOCUS VS. SCREEN TIME</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: theme.text }]}>Focus time</Text>
            <Text style={[styles.progressValue, { color: theme.text }]}>{totalFocusHours}h</Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.surface }]}>
            <View style={[styles.fill, { backgroundColor: theme.success, width: `${Math.min((totalFocusMinutes / 60) * 10, 100)}%` }]} />
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: theme.text }]}>Distracted time</Text>
            <Text style={[styles.progressValue, { color: theme.text }]}>{totalDistractedHours}h</Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.surface }]}>
            <View style={[styles.fill, { backgroundColor: theme.secondary, width: `${Math.min((totalDistractedMinutes / 60) * 10, 100)}%` }]} />
          </View>
        </View>

      </ScrollView>
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  summaryValue: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.heading,
    marginBottom: 4,
  },
  summaryLabel: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.caption,
  },
  sectionTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.label,
    marginBottom: spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginBottom: spacing.xxl,
  },
  barWrapper: {
    alignItems: 'center',
    width: 32,
  },
  barBackground: {
    width: 24,
    height: 120,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    marginTop: spacing.sm,
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.caption,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
  },
  progressValue: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.body,
  },
  track: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  }
});
