/**
 * Client-Side Local Storage & Offline Database Fallback Service
 * 
 * Provides transparent, resilient local caching and mock storage operations
 * for Leads, Projects, Tasks, Chat Messages, and User Preferences.
 * Ensures the application is 100% operational even when Cloud Firestore
 * is not provisioned or encounters database-not-found / network errors.
 */

import { ProjectLead, ChatMessage } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'clientops_local_projects',
  TASKS: 'clientops_local_tasks',
  CHAT: 'clientops_local_chat_messages',
  PREFERENCES: 'clientops_local_preferences',
  USER_PROFILES: 'clientops_local_user_profiles',
  SYNC_STATUS: 'clientops_storage_mode'
};

export interface LocalTaskItem {
  id: string;
  projectId: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  step?: number;
  completedAt?: string;
  updatedAt: string;
}

class LocalDatabaseFallback {
  private isStorageAvailable: boolean = true;

  constructor() {
    this.checkStorage();
  }

  private checkStorage(): boolean {
    if (typeof window === 'undefined') {
      this.isStorageAvailable = false;
      return false;
    }
    try {
      const testKey = '__test_storage__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      this.isStorageAvailable = true;
      return true;
    } catch {
      this.isStorageAvailable = false;
      return false;
    }
  }

  // ==========================================
  // PROJECTS & LEADS
  // ==========================================

  public getProjects(): ProjectLead[] {
    if (!this.checkStorage()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (raw) {
        return JSON.parse(raw);
      }
      // Check legacy key if present
      const legacyRaw = localStorage.getItem('clientops_cached_projects');
      if (legacyRaw) {
        return JSON.parse(legacyRaw);
      }
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to parse projects:', e);
    }
    return [];
  }

  public saveProjects(projects: ProjectLead[]): boolean {
    if (!this.checkStorage()) return false;
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      localStorage.setItem('clientops_cached_projects', JSON.stringify(projects));
      return true;
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to save projects:', e);
      return false;
    }
  }

  public saveProject(project: Partial<ProjectLead> & { id: string }): boolean {
    if (!this.checkStorage()) return false;
    try {
      const current = this.getProjects();
      const idx = current.findIndex(p => p.id === project.id);
      let updated: ProjectLead[];
      const now = new Date().toISOString();

      if (idx >= 0) {
        updated = [...current];
        updated[idx] = {
          ...updated[idx],
          ...project,
          updatedAt: now
        } as ProjectLead;
      } else {
        const newProj = {
          ...project,
          createdAt: project.createdAt || now,
          updatedAt: now
        } as ProjectLead;
        updated = [newProj, ...current];
      }

      this.saveProjects(updated);
      return true;
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to update project:', e);
      return false;
    }
  }

  public deleteProject(projectId: string): boolean {
    if (!this.checkStorage()) return false;
    try {
      const current = this.getProjects();
      const filtered = current.filter(p => p.id !== projectId);
      this.saveProjects(filtered);
      return true;
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to delete project:', e);
      return false;
    }
  }

  // ==========================================
  // TASKS
  // ==========================================

  public getTasks(projectId?: string): LocalTaskItem[] {
    if (!this.checkStorage()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (raw) {
        const tasks: LocalTaskItem[] = JSON.parse(raw);
        if (projectId) {
          return tasks.filter(t => t.projectId === projectId);
        }
        return tasks;
      }
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to load tasks:', e);
    }
    return [];
  }

  public saveTask(task: LocalTaskItem): boolean {
    if (!this.checkStorage()) return false;
    try {
      const current = this.getTasks();
      const idx = current.findIndex(t => t.id === task.id);
      let updated: LocalTaskItem[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = { ...updated[idx], ...task, updatedAt: new Date().toISOString() };
      } else {
        updated = [task, ...current];
      }
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to save task:', e);
      return false;
    }
  }

  // ==========================================
  // CHAT MESSAGES
  // ==========================================

  public getChatMessages(channel?: string): ChatMessage[] {
    if (!this.checkStorage()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
      if (raw) {
        const messages: ChatMessage[] = JSON.parse(raw);
        if (channel) {
          return messages.filter(m => (m as any).channel === channel);
        }
        return messages;
      }
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to load chat messages:', e);
    }
    return [];
  }

  public saveChatMessage(msg: {
    channel: string;
    sender: string;
    role: string;
    text: string;
    timestamp?: string;
  }): boolean {
    if (!this.checkStorage()) return false;
    try {
      const current = this.getChatMessages();
      const newMsg: ChatMessage = {
        id: `local_chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: msg.sender,
        role: msg.role as any,
        message: msg.text,
        timestamp: msg.timestamp || new Date().toISOString(),
        channel: msg.channel
      } as any;

      const updated = [...current.slice(-100), newMsg];
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to save chat message:', e);
      return false;
    }
  }

  // ==========================================
  // USER PREFERENCES & PROFILES
  // ==========================================

  public savePreferences(userId: string, prefs: Record<string, any>): boolean {
    if (!this.checkStorage()) return false;
    try {
      const allPrefsRaw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      const allPrefs = allPrefsRaw ? JSON.parse(allPrefsRaw) : {};
      allPrefs[userId] = {
        ...allPrefs[userId],
        ...prefs,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(allPrefs));
      return true;
    } catch (e) {
      console.warn('[LocalStorageDB] Failed to save preferences:', e);
      return false;
    }
  }

  public getPreferences(userId: string): Record<string, any> | null {
    if (!this.checkStorage()) return null;
    try {
      const allPrefsRaw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (allPrefsRaw) {
        const allPrefs = JSON.parse(allPrefsRaw);
        return allPrefs[userId] || null;
      }
    } catch {
      return null;
    }
    return null;
  }
}

export const localDatabase = new LocalDatabaseFallback();
