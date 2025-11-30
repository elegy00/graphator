/**
 * Server initialization module
 * This starts background services when the server starts
 */

import { HomeAssistantClient } from './services/api/homeAssistantClient';
import { SensorDiscoveryService } from './services/sensorDiscovery';
import { BackgroundDataCollectionService } from './services/backgroundDataCollection.server';
import { getAuthToken, getHomeAssistantUrl } from './config/auth';

let backgroundService: BackgroundDataCollectionService | null = null;
let isInitialized = false;

/**
 * Initialize server-side services
 * This should be called once when the server starts
 */
export async function initializeServer() {
  if (isInitialized) {
    console.log('[Server] Already initialized, skipping...');
    return backgroundService;
  }

  console.log('[Server] Initializing server services...');

  try {
    const apiUrl = getHomeAssistantUrl();
    const apiToken = getAuthToken();

    if (!apiUrl || !apiToken) {
      console.warn('[Server] Home Assistant credentials not configured. Background collection will not start.');
      return null;
    }

    const client = new HomeAssistantClient(apiUrl, apiToken);
    const discoveryService = new SensorDiscoveryService(client);
    
    // Discover sensors
    console.log('[Server] Discovering sensors...');
    const sensors = await discoveryService.discoverSensors();
    console.log(`[Server] Found ${sensors.length} sensors`);

    // Start background collection
    backgroundService = new BackgroundDataCollectionService(client);
    await backgroundService.start(sensors, 60000); // 60 seconds

    isInitialized = true;
    console.log('[Server] Server initialization complete');

    // Periodically re-discover sensors (every 5 minutes)
    setInterval(async () => {
      try {
        console.log('[Server] Re-discovering sensors...');
        const updatedSensors = await discoveryService.discoverSensors();
        if (backgroundService) {
          await backgroundService.updateSensors(updatedSensors);
        }
      } catch (error) {
        console.error('[Server] Failed to re-discover sensors:', error);
      }
    }, 5 * 60 * 1000);

    return backgroundService;
  } catch (error) {
    console.error('[Server] Failed to initialize server:', error);
    return null;
  }
}

/**
 * Get the background service instance (for monitoring/stats)
 */
export function getBackgroundService() {
  return backgroundService;
}

/**
 * Graceful shutdown
 */
export function shutdownServer() {
  console.log('[Server] Shutting down...');
  if (backgroundService) {
    backgroundService.stop();
  }
  isInitialized = false;
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownServer);
  process.on('SIGINT', shutdownServer);
}

// Auto-initialize when this module is loaded (server-side only)
if (typeof document === 'undefined') {
  console.log('[Server.init] Module loaded, starting initialization...');
  initializeServer().catch(error => {
    console.error('[Server.init] Auto-initialization failed:', error);
  });
}
