import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore } from '@/store/taskStore';
import TaskCard from '@/components/ui/TaskCard';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

export default function CalendarScreen() {
  const { theme } = useThemeStore();
  const { tasks, toggleTask, deleteTask, categories, selectedDate, setSelectedDate } = useTaskStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Tasks for selected date
  const priorityMap: any = { High: 3, Medium: 2, Low: 1 };
  const filteredTasks = tasks.filter(t => {
    return t.date === selectedDate;
  }).sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]);

  const getCategoryColor = (categoryId: string) => categories.find(c => c.id === categoryId)?.color || theme.textMuted;
  const getCategoryName = (categoryId: string) => categories.find(c => c.id === categoryId)?.name || '';

  const getDayIndicator = (dayDate: Date) => {
    const dStr = format(dayDate, 'yyyy-MM-dd');
    const dayTasks = tasks.filter(t => t.date === dStr);
    if (dayTasks.length === 0) return null;
    const allDone = dayTasks.every(t => t.isCompleted);
    return <View style={[styles.indicatorDot, { backgroundColor: allDone ? theme.success : theme.primary }]} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header & Calendar Block */}
        <LinearGradient
          colors={[theme.background, `${theme.primary}15`]}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Schedule</Text>
            <CalendarIcon color={theme.primary} size={28} />
          </View>

          {/* Custom Grid Calendar */}
          <View style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
                <ChevronLeft color={theme.text} size={24} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: theme.text }]}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
                <ChevronRight color={theme.text} size={24} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Header */}
            <View style={styles.weekDaysRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <Text key={day} style={[styles.weekDayText, { color: theme.textMuted }]}>{day}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = selectedDate === dateStr;
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);

                return (
                  <TouchableOpacity 
                    key={dateStr}
                    onPress={() => setSelectedDate(dateStr)}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: theme.primary },
                      isDayToday && !isSelected && { borderWidth: 1, borderColor: theme.primary }
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: isSelected ? '#FFF' : (isCurrentMonth ? theme.text : theme.textMuted) },
                    ]}>
                      {format(day, 'd')}
                    </Text>
                    {getDayIndicator(day)}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </LinearGradient>

        {/* Tasks Section for Selected Date */}
        <View style={styles.tasksSection}>
          <Text style={[styles.tasksSectionTitle, { color: theme.text }]}>
            Tasks for {format(new Date(selectedDate), 'MMM d, yyyy')}
          </Text>
          
          <View style={styles.tasksList}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  categoryName={getCategoryName(task.categoryId)}
                  categoryColor={getCategoryColor(task.categoryId)}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                  No tasks scheduled. Enjoy your day! 🌟
                </Text>
              </View>
            )}
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
  headerGradient: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.display,
  },
  calendarCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  monthBtn: {
    padding: spacing.xs,
  },
  monthTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.heading,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 columns
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
    marginBottom: 2,
  },
  dayText: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 6,
  },
  tasksSection: {
    padding: spacing.xl,
  },
  tasksSectionTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.heading,
    marginBottom: spacing.lg,
  },
  tasksList: {
    gap: spacing.md,
  },
  emptyBox: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
    textAlign: 'center',
  }
});
