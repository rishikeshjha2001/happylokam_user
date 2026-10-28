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
import * as Updates from 'expo-updates';

type SyncListener = (event: 'all' | 'hero' | 'sections' | 'categories') => void;

export interface ManualUpdateResult {
  success: boolean;
  isCodeUpdateAvailable: boolean;
  message: string;
  heroCount: number;
  sectionCount: number;
  categoryCount: number;
  timestamp: number;
}

class OtaSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private timer: any = null;
  private isSyncing = false;
  private lastSyncTimestamp = 0;
  private autoSyncIntervalMs = 60000; // Refresh cloud content while the app is active.

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
  public startAutoSync(intervalMs = 60000) {
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
      const { getUserNotifications, getUserWallet } = require('./api');
      const [heroSlides, sections, categories] = await Promise.all([
        getHeroSlides().catch(() => []),
        getAdminCustomSections().catch(() => []),
        getAdminCustomCategories().catch(() => []),
        getUserNotifications().catch(() => []),
        getUserWallet().catch(() => ({ walletBalance: 0 })),
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

  /**
   * Manual Update System: Checks code OTA bundles & forces live content synchronization
   */
  public async triggerManualUpdate(): Promise<ManualUpdateResult> {
    let isCodeUpdate = false;
    let codeMessage = '';

    // Check for Expo OTA Bundle update if expo-updates native module exists
    try {
      if (Updates.isEnabled) {
        const updateCheck = await Updates.checkForUpdateAsync();
        if (updateCheck.isAvailable) {
          isCodeUpdate = true;
          codeMessage = 'New binary patch detected! Downloading code update...';
          await Updates.fetchUpdateAsync();
          Updates.reloadAsync();
        }
      }
    } catch (e) {
      // In development or when expo-updates native binary is absent, gracefully proceed to content OTA
    }

    try {
      const syncResult = await this.triggerSync();
      return {
        success: true,
        isCodeUpdateAvailable: isCodeUpdate,
        message: isCodeUpdate
          ? codeMessage
          : 'App and celebration catalog are completely up to date with cloud servers.',
        heroCount: syncResult.heroSlides.length,
        sectionCount: syncResult.sections.length,
        categoryCount: syncResult.categories.length,
        timestamp: this.lastSyncTimestamp || Date.now(),
      };
    } catch (err: any) {
      return {
        success: false,
        isCodeUpdateAvailable: false,
        message: err?.message || 'Sync encountered a temporary network delay.',
        heroCount: 0,
        sectionCount: 0,
        categoryCount: 0,
        timestamp: Date.now(),
      };
    }
  }

  public getLastSyncTime(): number {
    return this.lastSyncTimestamp;
  }

  /**
   * Downloads a compatible JavaScript update silently. Expo activates the
   * downloaded bundle on the next launch, so an in-progress booking is never
   * interrupted by a forced reload.
   */
  public async checkForCodeUpdate(): Promise<boolean> {
    try {
      if (!Updates.isEnabled) return false;
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) return false;
      await Updates.fetchUpdateAsync();
      return true;
    } catch (error) {
      console.warn('[OtaSync] Code update check failed:', error);
      return false;
    }
  }
}

export const OtaSync = new OtaSyncManager();
export default OtaSync;
