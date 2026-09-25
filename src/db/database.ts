import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { Task } from '@/store/taskStore';

// Only open DB if not on web
let db: any = null;
if (Platform.OS !== 'web') {
  db = SQLite.openDatabaseSync('dayflow.db');
}

export const initDB = () => {
  if (Platform.OS === 'web') return;
  
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'male'
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      priority TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      isCompleted INTEGER NOT NULL,
      user_id INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      focus_minutes INTEGER DEFAULT 0,
      distracted_minutes INTEGER DEFAULT 0,
      user_id INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_id, key)
    );
  `);

  // Add user_id column to existing tables (fails silently if already exists)
  try { db.execSync('ALTER TABLE tasks ADD COLUMN user_id INTEGER DEFAULT 1;'); } catch (e) {}
  try { db.execSync('ALTER TABLE usage_logs ADD COLUMN user_id INTEGER DEFAULT 1;'); } catch (e) {}
  try { db.execSync('ALTER TABLE users ADD COLUMN gender TEXT DEFAULT "male";'); } catch (e) {}
};

let currentUserId = 1; // Default to 1 (legacy local user)
export const setCurrentUserId = (id: number) => {
  currentUserId = id;
};

// Simple in-memory fallback for web preview
let webTasks: Task[] = [];

export const getTasks = (): Task[] => {
  if (Platform.OS === 'web') return webTasks.filter((t: any) => t.userId === currentUserId);
  
  const result = db.getAllSync('SELECT * FROM tasks WHERE user_id = ?', [currentUserId]);
  return result.map((row: any) => ({
    ...row,
    isCompleted: row.isCompleted === 1,
  })) as Task[];
};

export const addTaskToDB = (task: Task) => {
  if (Platform.OS === 'web') {
    webTasks.push(task);
    return;
  }
  
  db.runSync(
    'INSERT INTO tasks (id, title, date, time, priority, categoryId, isCompleted, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      task.id,
      task.title,
      task.date,
      task.time,
      task.priority,
      task.categoryId,
      task.isCompleted ? 1 : 0,
      currentUserId
    ]
  );
};

export const updateTaskInDB = (task: Task) => {
  if (Platform.OS === 'web') {
    const index = webTasks.findIndex(t => t.id === task.id);
    if (index !== -1) webTasks[index] = task;
    return;
  }
  
  db.runSync(
    'UPDATE tasks SET title = ?, date = ?, time = ?, priority = ?, categoryId = ?, isCompleted = ? WHERE id = ? AND user_id = ?',
    [
      task.title,
      task.date,
      task.time,
      task.priority,
      task.categoryId,
      task.isCompleted ? 1 : 0,
      task.id,
      currentUserId
    ]
  );
};

export const toggleTaskInDB = (id: string, isCompleted: boolean) => {
  if (Platform.OS === 'web') {
    const index = webTasks.findIndex(t => t.id === id);
    if (index !== -1) webTasks[index].isCompleted = isCompleted;
    return;
  }
  
  db.runSync('UPDATE tasks SET isCompleted = ? WHERE id = ? AND user_id = ?', [isCompleted ? 1 : 0, id, currentUserId]);
};

export const deleteTaskFromDB = (id: string) => {
  if (Platform.OS === 'web') {
    webTasks = webTasks.filter(t => t.id !== id);
    return;
  }
  
  db.runSync('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, currentUserId]);
};

// Usage Logs
export type UsageLog = {
  id?: number;
  date: string;
  focus_minutes: number;
  distracted_minutes: number;
};

export const addFocusTime = (minutes: number) => {
  if (Platform.OS === 'web') return;
  const today = new Date().toISOString().split('T')[0];
  
  const existingResult = db.getFirstSync('SELECT id, focus_minutes FROM usage_logs WHERE date = ? AND user_id = ?', [today, currentUserId]);
  const existing = existingResult as {id: number, focus_minutes: number} | null;
  if (existing) {
    db.runSync('UPDATE usage_logs SET focus_minutes = ? WHERE id = ?', [existing.focus_minutes + minutes, existing.id]);
  } else {
    db.runSync('INSERT INTO usage_logs (date, focus_minutes, distracted_minutes, user_id) VALUES (?, ?, 0, ?)', [today, minutes, currentUserId]);
  }
};

export const addDistractedTime = (minutes: number) => {
  if (Platform.OS === 'web') return;
  const today = new Date().toISOString().split('T')[0];
  
  const existingResult = db.getFirstSync('SELECT id, distracted_minutes FROM usage_logs WHERE date = ? AND user_id = ?', [today, currentUserId]);
  const existing = existingResult as {id: number, distracted_minutes: number} | null;
  if (existing) {
    db.runSync('UPDATE usage_logs SET distracted_minutes = ? WHERE id = ?', [existing.distracted_minutes + minutes, existing.id]);
  } else {
    db.runSync('INSERT INTO usage_logs (date, focus_minutes, distracted_minutes, user_id) VALUES (?, 0, ?, ?)', [today, minutes, currentUserId]);
  }
};

export const getUsageLogs = (): UsageLog[] => {
  if (Platform.OS === 'web') return [];
  return db.getAllSync('SELECT * FROM usage_logs WHERE user_id = ?', [currentUserId]) as UsageLog[];
};

// Settings
export const getSetting = (key: string, defaultValue: string): string => {
  if (Platform.OS === 'web') return defaultValue;
  const result = db.getFirstSync('SELECT value FROM user_settings WHERE key = ? AND user_id = ?', [key, currentUserId]);
  const row = result as {value: string} | null;
  return row ? row.value : defaultValue;
};

export const setSetting = (key: string, value: string) => {
  if (Platform.OS === 'web') return;
  db.runSync('INSERT OR REPLACE INTO user_settings (user_id, key, value) VALUES (?, ?, ?)', [currentUserId, key, value]);
};

// Gamification (Zen Points)
export const getZenPoints = (): number => {
  return parseInt(getSetting('zen_points', '0'), 10);
};

export const addZenPoints = (points: number) => {
  const current = getZenPoints();
  setSetting('zen_points', (current + points).toString());
};

// Auth Functions
export const registerUser = async (user: Omit<import('@/store/authStore').User, 'id'>, password: string): Promise<import('@/store/authStore').User> => {
  if (Platform.OS === 'web') throw new Error('Web not supported for local auth');
  
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
  
  const existingResult = db.getFirstSync('SELECT id FROM users WHERE email = ?', [user.email]);
  if (existingResult) {
    throw new Error('Email already registered');
  }

  const result = db.runSync(
    'INSERT INTO users (first_name, last_name, birthday, phone, email, password_hash, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user.firstName, user.lastName, user.birthday, user.phone, user.email, hash, user.gender]
  );
  
  return {
    ...user,
    id: result.lastInsertRowId
  };
};

export const loginUser = async (email: string, password: string): Promise<import('@/store/authStore').User> => {
  if (Platform.OS === 'web') throw new Error('Web not supported for local auth');
  
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
  
  const result = db.getFirstSync(
    'SELECT id, first_name, last_name, birthday, phone, email, gender FROM users WHERE email = ? AND password_hash = ?', 
    [email, hash]
  );
  
  const user = result as any;
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    birthday: user.birthday,
    phone: user.phone,
    email: user.email,
    gender: user.gender
  };
};
