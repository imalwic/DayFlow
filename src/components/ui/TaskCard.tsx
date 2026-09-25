import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Circle, CheckCircle2, Trash2 } from 'lucide-react-native';
import { useThemeStore } from '@/store/themeStore';
import { Task } from '@/store/taskStore';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';

interface TaskCardProps {
  task: Task;
  categoryName: string;
  categoryColor: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, categoryName, categoryColor, onToggle, onDelete }: TaskCardProps) {
  const { theme } = useThemeStore();

  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={() => onDelete(task.id)} style={[styles.rightAction, { backgroundColor: theme.surface }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 color={theme.textMuted} size={24} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.leftAction, { backgroundColor: theme.success }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <CheckCircle2 color="#FFF" size={24} />
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableLeftOpen={() => onToggle(task.id)}
      overshootRight={false}
      overshootLeft={false}
      friction={2}>
      <View style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => onToggle(task.id)} style={styles.checkboxContainer}>
          {task.isCompleted ? (
            <CheckCircle2 color={theme.success} size={24} />
          ) : (
            <Circle color={theme.border} size={24} />
          )}
        </TouchableOpacity>
        <View style={styles.taskInfo}>
          <Text style={[
            styles.taskTitle, 
            { color: theme.text, textDecorationLine: task.isCompleted ? 'line-through' : 'none' }
          ]}>
            {task.title}
          </Text>
          <Text style={[styles.taskMeta, { color: theme.textMuted }]}>
            {task.time} · {categoryName}
          </Text>
        </View>
        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskMeta: {
    fontFamily: typography.fonts.liberationSans,
    fontSize: typography.sizes.caption,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: 1,
    marginLeft: spacing.sm,
  },
  leftAction: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: 1,
    marginRight: spacing.sm,
  },
});
