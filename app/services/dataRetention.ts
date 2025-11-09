import { dataStore } from './storage/inMemoryStore';

const EVICTION_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export class DataRetentionService {
  private intervalId: NodeJS.Timeout | null = null;

  start(): void {
    if (this.intervalId) {
      console.warn('Data retention service already running');
      return;
    }

    // Run eviction immediately
    this.runEviction();

    // Then run every hour
    this.intervalId = setInterval(() => {
      this.runEviction();
    }, EVICTION_INTERVAL_MS);

    console.log('Data retention service started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Data retention service stopped');
  }

  private runEviction(): void {
    const evictedCount = dataStore.evictOldData();
    if (evictedCount > 0) {
      console.log(`Evicted ${evictedCount} old data points`);
    }
  }
}

export const dataRetention = new DataRetentionService();
