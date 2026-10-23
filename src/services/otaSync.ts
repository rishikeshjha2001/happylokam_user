import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHeroSlides, getCategories } from './api';
import {
  getAdminCustomSections,
  getAdminCustomCategories,
  AdminCustomSection,
  AdminCustomCategory,
} from './adminSections';
import { DbHeroSlide } from '../constants/databaseModels';

type SyncListener = (event: 'all' | 'hero' | 'sections' | 'categories') => void;

class OtaSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private timer: any = null;
  private isSyncing = false;
  private lastSyncTimestamp = 0;
  private autoSyncIntervalMs = 20000; // 20s auto-check for admin uploads

  constructor() {
    this.initAppStateListener();
  }

  private initAppStateListener() {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Instant check whenever app comes to foreground
        this.triggerSync();
      }
    });
  }

  /**
   * Subscribe to live OTA updates
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: 'all' | 'hero' | 'sections' | 'categories') {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.warn('[OtaSync] Listener error:', err);
      }
    });
  }

  /**
   * Start background periodic auto-sync
   */
  public startAutoSync(intervalMs = 20000) {
    this.autoSyncIntervalMs = intervalMs;
    if (this.timer) clearInterval(this.timer);

    // Initial sync
    this.triggerSync();

    this.timer = setInterval(() => {
      this.triggerSync();
    }, this.autoSyncIntervalMs);
  }

  public stopAutoSync() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Manually or automatically trigger OTA sync with server
   */
  public async triggerSync(): Promise<{
    heroSlides: DbHeroSlide[];
    sections: AdminCustomSection[];
    categories: AdminCustomCategory[];
  }> {
    if (this.isSyncing) {
      return { heroSlides: [], sections: [], categories: [] };
    }

    this.isSyncing = true;
    try {
      const [heroSlides, sections, categories] = await Promise.all([
        getHeroSlides().catch(() => []),
        getAdminCustomSections().catch(() => []),
        getAdminCustomCategories().catch(() => []),
      ]);

      this.lastSyncTimestamp = Date.now();
      await AsyncStorage.setItem('@happylokam_ota_last_sync', String(this.lastSyncTimestamp));

      this.notify('all');

      return { heroSlides, sections, categories };
    } catch (err) {
      console.warn('[OtaSync] Sync failed, maintaining cached offline state:', err);
      return { heroSlides: [], sections: [], categories: [] };
    } finally {
      this.isSyncing = false;
    }
  }

  public getLastSyncTime(): number {
    return this.lastSyncTimestamp;
  }
}

export const OtaSync = new OtaSyncManager();
export default OtaSync;
