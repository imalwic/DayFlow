import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useTaskStore, Priority } from '@/store/taskStore';
import { typography } from '@/theme/typography';
import { spacing, radius } from '@/theme/spacing';
import { Colors } from '@/constants/theme'; // Just fallback if needed, but we use themeStore

export default function AddTaskScreen() {
  const { theme } = useThemeStore();
  const { addTask, categories, selectedDate } = useTaskStore();

  const [title, setTitle] = useState('');
  
  // Date & Time states
  const [selectedDateTime, setSelectedDateTime] = useState(new Date(selectedDate + 'T10:00:00'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [priority, setPriority] = useState<Priority>('Medium');
  const [categoryId, setCategoryId] = useState<string>('1'); // Default Work

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDateTime(date);
  };

  const onTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) setSelectedDateTime(date);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedDate = `${selectedDateTime.getFullYear()}-${pad(selectedDateTime.getMonth() + 1)}-${pad(selectedDateTime.getDate())}`;
  const formattedTime = selectedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSave = () => {
    if (!title.trim()) return;
    
    addTask({
      title,
      date: formattedDate,
      time: formattedTime,
      priority,
      categoryId,
      isCompleted: false,
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.headerButton, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.headerButton, { color: theme.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>New Task</Text>

        {/* TITLE */}
        <Text style={[styles.label, { color: theme.textMuted }]}>TITLE</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
          placeholder="Read chapter 4"
          placeholderTextColor={theme.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* DATE & TIME (Row) */}
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={[styles.label, { color: theme.textMuted }]}>DATE</Text>
            <TouchableOpacity 
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: theme.text }}>{formattedDate}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ width: spacing.lg }} />
          <View style={styles.flex1}>
            <Text style={[styles.label, { color: theme.textMuted }]}>TIME</Text>
            <TouchableOpacity 
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={{ color: theme.text }}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDateTime}
            mode="date"
            display="default"
            onValueChange={onDateChange}
            onDismiss={() => setShowDatePicker(false)}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={selectedDateTime}
            mode="time"
            display="default"
            onValueChange={onTimeChange}
            onDismiss={() => setShowTimePicker(false)}
          />
        )}

        {/* PRIORITY */}
        <Text style={[styles.label, { color: theme.textMuted }]}>PRIORITY</Text>
        <View style={styles.chipsRow}>
          {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.chip,
                { 
                  backgroundColor: priority === p ? theme.secondary : theme.surface,
                  borderColor: priority === p ? theme.secondary : theme.border
                }
              ]}
              onPress={() => setPriority(p)}>
              <Text style={[
                styles.chipText, 
                { color: priority === p ? '#FFF' : theme.text }
              ]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CATEGORY */}
        <Text style={[styles.label, { color: theme.textMuted }]}>CATEGORY</Text>
        <View style={styles.chipsRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.chip,
                { 
                  backgroundColor: categoryId === cat.id ? theme.surface : theme.background,
                  borderColor: categoryId === cat.id ? cat.color : theme.border
                }
              ]}
              onPress={() => setCategoryId(cat.id)}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text style={[styles.chipText, { color: theme.text }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerButton: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.label,
  },
  pageTitle: {
    fontFamily: typography.fonts.poppinsSemiBold,
    fontSize: typography.sizes.display,
    marginBottom: spacing.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    fontFamily: typography.fonts.liberationSans, // using fallback if liberation-sans failed
    fontSize: typography.sizes.body,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: typography.fonts.poppinsMedium,
    fontSize: typography.sizes.label,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  }
});
