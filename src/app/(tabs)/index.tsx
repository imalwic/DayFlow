import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Flame } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import { useMotivationStore } from '@/store/motivationStore';
import { useAuthStore } from '@/store/authStore';
import { getUsageLogs } from '@/db/database';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import TaskCard from '@/components/ui/TaskCard';
import BirthdayModal from '@/components/BirthdayModal';

export default function HomeScreen() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { tasks, toggleTask, deleteTask, categories, selectedDate, setSelectedDate } = useTaskStore();
  const { streak, dailyQuote, incrementStreak } = useMotivationStore();
  
  const confettiRef = React.useRef<LottieView>(null);
  const [selectedDateFocusMinutes, setSelectedDateFocusMinutes] = React.useState(0);
  
  // Animation for the mood emoji
  const bounceAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);
  
  const currentDate = new Date(selectedDate);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday Start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const priorityMap = { High: 3, Medium: 2, Low: 1 };
  
  const filteredTasks = tasks.filter(t => {
    // If the task date is "Today", treat it as today's actual date for now
    if (t.date.toLowerCase() === 'today') {
      return isSameDay(currentDate, new Date());
    }
    return t.date === selectedDate;
  }).sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

  React.useEffect(() => {
    const logs = getUsageLogs();
    const log = logs.find((l: any) => l.date === selectedDate);
    setSelectedDateFocusMinutes(log?.focus_minutes || 0);
  }, [selectedDate, tasks]); // Update when selectedDate or tasks change (as tasks might complete a session)

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    const wasCompleted = task?.isCompleted;
    
    toggleTask(id);

    // If it wasn't completed, and it's being completed now
    if (!wasCompleted) {
      // Check if it's the first task completed today
      const alreadyCompletedAny = tasks.some(t => t.id !== id && t.isCompleted);
      if (!alreadyCompletedAny) {
        incrementStreak();
        confettiRef.current?.play(0);
      }
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.color || theme.textMuted;
  };
  
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  const getMoodConfig = () => {
    const hours = selectedDateFocusMinutes / 60;
    const isFemale = user?.gender === 'female';

    if (selectedDateFocusMinutes === 0) {
      return {
        image: isFemale ? require('../../assets/moods/girl_sleep.jpg') : require('../../assets/moods/boy_sleep.jpg'),
        color: theme.textMuted,
        bg: theme.border,
        msg: "No focus time yet. Let's start!"
      };
    }
    if (hours < 2) {
      return {
        image: isFemale ? require('../../assets/moods/girl_sad.jpg') : require('../../assets/moods/boy_sad.jpg'),
        color: '#ef4444',
        bg: '#ef444420',
        msg: "A slow start. You can do better!"
      };
    }
    if (hours < 6) {
      return {
        image: isFemale ? require('../../assets/moods/girl_normal.jpg') : require('../../assets/moods/boy_normal.jpg'),
        color: theme.primary,
        bg: `${theme.primary}20`,
        msg: "Good focus! Keep the momentum."
      };
    }
    if (hours <= 14) {
      return {
        image: isFemale ? require('../../assets/moods/girl_happy.jpg') : require('../../assets/moods/boy_happy.jpg'),
        color: theme.success,
        bg: `${theme.success}20`,
        msg: "Amazing work! You're on fire."
      };
    }
    return {
      image: isFemale ? require('../../assets/moods/girl_very_happy.jpg') : require('../../assets/moods/boy_very_happy.jpg'),
      color: theme.warning,
      bg: `${theme.warning}20`,
      msg: "Incredible! You are unstoppable!"
    };
  };

  const moodConfig = getMoodConfig();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <BirthdayModal />
      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.dateText, { color: theme.textMuted }]}>{format(new Date(), 'EEEE, d MMMM')}</Text>
            <Text style={[styles.greeting, { color: theme.text }]}>Good morning{user?.firstName ? `, ${user.firstName}` : ''}</Text>
          </View>
          <View style={[styles.streakPill, { backgroundColor: theme.surface }]}>
            <LottieView
              ref={confettiRef}
              source={require('@/assets/confetti.json')}
              style={styles.confetti}
              loop={false}
            />
            <Flame color={theme.warning} size={16} />
            <Text style={[styles.streakText, { color: theme.warning }]}>{streak}</Text>
          </View>
        </View>

        {/* Quote Card */}
        <View style={[styles.quoteCard, { backgroundColor: theme.primary }]}>
          <Text style={[styles.quoteLabel, { color: '#FFF', opacity: 0.8 }]}>TODAY'S QUOTE</Text>
          <Text style={[styles.quoteText, { color: '#FFF' }]}>
            "{dailyQuote}"
          </Text>
        </View>

        {/* Calendar Strip */}
        <View style={styles.calendarStrip}>
          {weekDays.map((day, i) => {
            const isSelected = isSameDay(day, currentDate);
            const dateStr = format(day, 'yyyy-MM-dd');
            return (
              <TouchableOpacity 
                key={dateStr} 
                onPress={() => setSelectedDate(dateStr)}
                style={[
                  styles.calendarDay, 
                  isSelected ? { backgroundColor: theme.primary } : { backgroundColor: 'transparent' }
                ]}>
                <Text style={[
                  styles.calendarDayText, 
                  { color: isSelected ? '#FFF' : theme.text }
                ]}>
                  {format(day, 'EEEE').charAt(0)}{'\n'}{format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Focus Summary Card */}
        <View style={[styles.focusSummaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.focusSummaryLeft}>
            <Animated.View style={[styles.focusSummaryIconBox, { backgroundColor: moodConfig.bg, transform: [{ translateY: bounceAnim }] }]}>
              <Image source={moodConfig.image} style={{ width: 44, height: 44, borderRadius: 22 }} />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.focusSummaryTitle, { color: theme.text }]}>Focus Time</Text>
              <Text style={[styles.focusSummaryDesc, { color: theme.textMuted }]}>{moodConfig.msg}</Text>
            </View>
          </View>
          <Text style={[styles.focusSummaryTime, { color: moodConfig.color }]}>
            {Math.floor(selectedDateFocusMinutes / 60)}h {selectedDateFocusMinutes % 60}m
          </Text>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>PLAN FOR {format(currentDate, 'MMM d').toUpperCase()}</Text>
          <Text style={[styles.taskCount, { color: theme.primary }]}>{filteredTasks.length} tasks</Text>
        </View>

        <View style={styles.tasksList}>
          {filteredTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task}
              categoryName={getCategoryName(task.categoryId)}
              categoryColor={getCategoryColor(task.categoryId)}
              onToggle={handleToggleTask}
              onDelete={deleteTask}
            />
          ))}
          {filteredTasks.length === 0 && (
             <Text style={[styles.emptyText, { color: theme.textMuted }]}>No tasks for this date. Tap + to add one!</Text>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
        onPress={() => router.push('/add-task')}>
        <Plus color="#FFF" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  dateText: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.caption,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.display,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: 4,
    zIndex: 10,
  },
  confetti: {
    position: 'absolute',
    width: 150,
    height: 150,
    top: -50,
    left: -50,
    pointerEvents: 'none',
    zIndex: -1,
  },
  streakText: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.label,
  },
  quoteCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  quoteLabel: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.caption,
    marginBottom: spacing.sm,
  },
  quoteText: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
    lineHeight: 20,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  calendarDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    minWidth: 48,
  },
  calendarDayText: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.label,
    textAlign: 'center',
    lineHeight: 20,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.label,
  },
  taskCount: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.label,
  },
  tasksList: {
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: typography.fonts.liberationSans,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  focusSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  focusSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.sm,
  },
  focusSummaryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusSummaryTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.body,
  },
  focusSummaryDesc: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.caption,
  },
  focusSummaryTime: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.label,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});
