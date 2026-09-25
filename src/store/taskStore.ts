import { create } from 'zustand';
let Notifications: any = null;
// Notifications = require('expo-notifications');
console.log('expo-notifications bypassed for Expo Go compatibility');
import { getTasks, addTaskToDB, toggleTaskInDB, deleteTaskFromDB, getSetting } from '@/db/database';
import { useMotivationStore } from './motivationStore';

export type Priority = 'Low' | 'Medium' | 'High';

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Task = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format usually
  time: string;
  priority: Priority;
  categoryId: string;
  isCompleted: boolean;
};

type TaskState = {
  tasks: Task[];
  categories: Category[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  loadTasks: () => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
};

const defaultCategories: Category[] = [
  { id: '1', name: 'Work', color: '#4F3DE8' }, // Brand Violet
  { id: '2', name: 'Study', color: '#FF6B4A' }, // Ember Coral
  { id: '3', name: 'Personal', color: '#209A6C' }, // Growth Sage
];

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  categories: defaultCategories,
  selectedDate: (() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })(), // Default to local today (YYYY-MM-DD)
  setSelectedDate: (date) => set({ selectedDate: date }),
  loadTasks: () => {
    const dbTasks = getTasks();
    set({ tasks: dbTasks });
  },
  addTask: async (taskData) => {
    const newTask = {
      ...taskData,
      id: Math.random().toString(36).substring(7),
    };
    addTaskToDB(newTask);
    
    // Schedule Notification
    if (getSetting('reminders', 'false') === 'true') {
      try {
        const [year, month, day] = newTask.date.split('-');
        const [timePart, modifier] = newTask.time.split(' ');
        let [hours, minutes] = timePart.split(':');
        
        let h = parseInt(hours, 10);
        if (modifier) {
          // 12-hour format parsing
          const isPM = modifier.toUpperCase() === 'PM';
          if (h === 12) h = isPM ? 12 : 0;
          else if (isPM) h += 12;
        } else {
          // 24-hour format parsing, do nothing as h is already correct
        }
        
        const triggerDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(minutes));
        
        if (triggerDate.getTime() > Date.now() && Notifications) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "DayFlow Reminder 📝",
              body: `It's time to: ${newTask.title}`,
            },
            trigger: { date: triggerDate } as any,
          });
        }
      } catch (e) {
        console.log('Error scheduling notification', e);
      }
    }
    
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },
  toggleTask: (id) =>
    set((state) => {
      const updatedTasks = state.tasks.map((task) => {
        if (task.id === id) {
          const newStatus = !task.isCompleted;
          toggleTaskInDB(id, newStatus);
          
          if (newStatus) {
            useMotivationStore.getState().incrementStreak();
          }
          
          return { ...task, isCompleted: newStatus };
        }
        return task;
      });
      return { tasks: updatedTasks };
    }),
  deleteTask: (id) =>
    set((state) => {
      deleteTaskFromDB(id);
      return { tasks: state.tasks.filter((task) => task.id !== id) };
    }),
}));
