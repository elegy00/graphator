# Implementation Guide - Step by Step

## Overview
This guide breaks down the implementation into discrete, testable steps. Each step builds on the previous one and can be verified independently before moving forward.

## Prerequisites
- Node.js and npm installed
- Home Assistant API accessible with bearer token
- React Router v7 project set up (already done)
- TailwindCSS configured (already done)

---

## Phase 1: Foundation & API Integration

### Step 1: Set Up Type Definitions
**Goal**: Define TypeScript interfaces for the entire application  
**Duration**: 30 minutes  
**Dependencies**: None

**Tasks:**
1. Create `app/types/sensor.ts` with core interfaces:
   ```typescript
   export interface Sensor {
     id: string;
     friendlyName: string;
     entityId: string;
     type: 'temperature' | 'humidity' | 'both';
     unit: string;
     lastSeen: Date;
     status: 'online' | 'offline' | 'error';
   }
   
   export interface SensorReading {
     sensorId: string;
     timestamp: Date;
     temperature?: number;
     humidity?: number;
   }
   
   export interface HomeAssistantState {
     entity_id: string;
     state: string;
     attributes: {
       friendly_name?: string;
       unit_of_measurement?: string;
       device_class?: string;
       [key: string]: any;
     };
     last_changed: string;
     last_updated: string;
   }
   ```

2. Create `app/types/api.ts` for API response types:
   ```typescript
   export interface ApiError {
     message: string;
     code?: string;
   }
   
   export interface ApiResponse<T> {
     data?: T;
     error?: ApiError;
   }
   ```

**Testing:**
- Run `npx tsc --noEmit` to verify TypeScript compilation
- No runtime tests needed (type definitions only)

**Acceptance Criteria:**
- [ ] All types compile without errors
- [ ] Types are exported correctly
- [ ] No `any` types used

---

### Step 2: Create Home Assistant API Client
**Goal**: Build a reusable API client for Home Assistant  
**Duration**: 1 hour  
**Dependencies**: Step 1

**Tasks:**
1. Create `app/services/api/homeAssistantClient.ts`:
   ```typescript
   import type { HomeAssistantState } from '~/types/sensor';
   
   const API_BASE_URL = process.env.HA_API_URL || 'http://localhost:8123';
   const API_TOKEN = process.env.HA_API_TOKEN || '';
   
   export class HomeAssistantClient {
     private baseUrl: string;
     private token: string;
     
     constructor(baseUrl: string = API_BASE_URL, token: string = API_TOKEN) {
       this.baseUrl = baseUrl;
       this.token = token;
     }
     
     private async fetch<T>(endpoint: string): Promise<T> {
       const response = await fetch(`${this.baseUrl}${endpoint}`, {
         headers: {
           'Authorization': `Bearer ${this.token}`,
           'Content-Type': 'application/json',
         },
       });
       
       if (!response.ok) {
         throw new Error(`API Error: ${response.status} ${response.statusText}`);
       }
       
       return response.json();
     }
     
     async getAllStates(): Promise<HomeAssistantState[]> {
       return this.fetch<HomeAssistantState[]>('/api/states');
     }
     
     async getSensorState(entityId: string): Promise<HomeAssistantState> {
       return this.fetch<HomeAssistantState>(`/api/states/${entityId}`);
     }
   }
   
   export const haClient = new HomeAssistantClient();
   ```

2. Create test file `app/services/api/homeAssistantClient.test.ts`:
   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { HomeAssistantClient } from './homeAssistantClient';
   
   describe('HomeAssistantClient', () => {
     beforeEach(() => {
       global.fetch = vi.fn();
     });
     
     it('should fetch all states', async () => {
       const mockStates = [{ entity_id: 'sensor.test', state: '20' }];
       (global.fetch as any).mockResolvedValue({
         ok: true,
         json: async () => mockStates,
       });
       
       const client = new HomeAssistantClient('http://test', 'token');
       const states = await client.getAllStates();
       
       expect(states).toEqual(mockStates);
       expect(global.fetch).toHaveBeenCalledWith(
         'http://test/api/states',
         expect.objectContaining({
           headers: expect.objectContaining({
             'Authorization': 'Bearer token',
           }),
         })
       );
     });
     
     it('should throw error on failed request', async () => {
       (global.fetch as any).mockResolvedValue({
         ok: false,
         status: 401,
         statusText: 'Unauthorized',
       });
       
       const client = new HomeAssistantClient('http://test', 'token');
       
       await expect(client.getAllStates()).rejects.toThrow('API Error: 401');
     });
   });
   ```

**Testing:**
- Run `npm test` to verify unit tests pass
- Manually test against real Home Assistant API (optional)

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] Client properly adds Authorization header
- [ ] Error handling works correctly
- [ ] TypeScript compilation succeeds

---

### Step 3: Implement Sensor Discovery
**Goal**: Discover and parse sensors from Home Assistant API  
**Duration**: 1.5 hours  
**Dependencies**: Step 1, 2

**Important Note**: All API calls must be made server-side through React Router loaders to avoid CORS issues. The HomeAssistantClient is instantiated per-request in loaders, not as a singleton.

**Tasks:**
1. Create `app/services/sensorDiscovery.ts`:
   ```typescript
   import type { Sensor, HomeAssistantState } from '~/types/sensor';
   import type { HomeAssistantClient } from './api/homeAssistantClient';
   
   export class SensorDiscoveryService {
     private client: HomeAssistantClient;
     
     constructor(client: HomeAssistantClient) {
       this.client = client;
     }
     
     private getSensorType(state: HomeAssistantState): Sensor['type'] | null {
       const deviceClass = state.attributes.device_class;
       const unit = state.attributes.unit_of_measurement;
       
       if (deviceClass === 'temperature' || unit?.includes('°')) {
         return 'temperature';
       }
       if (deviceClass === 'humidity' || unit === '%') {
         return 'humidity';
       }
       return null;
     }
     
     private mapStateToSensor(state: HomeAssistantState): Sensor | null {
       const type = this.getSensorType(state);
       if (!type) return null;
       
       return {
         id: state.entity_id.replace('sensor.', ''),
         entityId: state.entity_id,
         friendlyName: state.attributes.friendly_name || state.entity_id,
         type,
         unit: state.attributes.unit_of_measurement || '',
         lastSeen: new Date(state.last_updated),
         status: 'online',
       };
     }
     
     async discoverSensors(): Promise<Sensor[]> {
       try {
         const states = await this.client.getAllStates();
         
         const sensors = states
           .filter(state => state.entity_id.startsWith('sensor.'))
           .map(state => this.mapStateToSensor(state))
           .filter((sensor): sensor is Sensor => sensor !== null);
         
         return sensors;
       } catch (error) {
         console.error('Failed to discover sensors:', error);
         throw error;
       }
     }
   }
   ```

2. Create test file `app/services/sensorDiscovery.test.ts`:
   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { SensorDiscoveryService } from './sensorDiscovery';
   import { HomeAssistantClient } from './api/homeAssistantClient';
   import type { HomeAssistantState } from '~/types/sensor';
   
   describe('SensorDiscoveryService', () => {
     let mockClient: HomeAssistantClient;
     
     beforeEach(() => {
       mockClient = {
         getAllStates: vi.fn(),
         getSensorState: vi.fn(),
       } as any;
     });
     
     it('should discover temperature sensors', async () => {
       const mockStates: HomeAssistantState[] = [
         {
           entity_id: 'sensor.living_room_temp',
           state: '20.5',
           attributes: {
             friendly_name: 'Living Room Temperature',
             unit_of_measurement: '°C',
             device_class: 'temperature',
           },
           last_changed: '2025-11-09T10:00:00Z',
           last_updated: '2025-11-09T10:00:00Z',
         },
       ];
       
       (mockClient.getAllStates as any).mockResolvedValue(mockStates);
       
       const service = new SensorDiscoveryService(mockClient);
       const sensors = await service.discoverSensors();
       
       expect(sensors).toHaveLength(1);
       expect(sensors[0]).toMatchObject({
         entityId: 'sensor.living_room_temp',
         friendlyName: 'Living Room Temperature',
         type: 'temperature',
         unit: '°C',
       });
     });
     
     it('should filter out non-sensor entities', async () => {
       const mockStates: HomeAssistantState[] = [
         {
           entity_id: 'light.living_room',
           state: 'on',
           attributes: {},
           last_changed: '2025-11-09T10:00:00Z',
           last_updated: '2025-11-09T10:00:00Z',
         },
       ];
       
       (mockClient.getAllStates as any).mockResolvedValue(mockStates);
       
       const service = new SensorDiscoveryService(mockClient);
       const sensors = await service.discoverSensors();
       
       expect(sensors).toHaveLength(0);
     });
   });
   ```

3. Update `app/routes/home.tsx` to use server-side loader:
   ```typescript
   import type { Route } from "./+types/home";
   import { useLoaderData } from "react-router";
   import { HomeAssistantClient } from "~/services/api/homeAssistantClient";
   import { SensorDiscoveryService } from "~/services/sensorDiscovery";
   import { getAuthToken, getHomeAssistantUrl } from "~/config/auth";
   
   export async function loader() {
     try {
       const client = new HomeAssistantClient(getHomeAssistantUrl(), getAuthToken());
       const discoveryService = new SensorDiscoveryService(client);
       const sensors = await discoveryService.discoverSensors();
       
       return { sensors, error: null };
     } catch (error) {
       console.error('Failed to discover sensors:', error);
       return {
         sensors: [],
         error: error instanceof Error ? error.message : 'Unknown error',
       };
     }
   }
   
   export default function Home() {
     const { sensors, error } = useLoaderData<typeof loader>();
     
     if (error) {
       return (
         <main className="flex items-center justify-center min-h-screen">
           <div className="text-center text-red-600">
             <p className="font-semibold mb-2">Error loading sensors</p>
             <p className="text-sm">{error}</p>
           </div>
         </main>
       );
     }
     
     return (
       <main className="container mx-auto px-4 py-8">
         <header className="mb-8">
           <h1 className="text-3xl font-bold mb-2">Sensor Monitor</h1>
           <p className="text-gray-600">
             {sensors.length} sensor{sensors.length !== 1 ? 's' : ''} discovered
           </p>
         </header>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {sensors.map(sensor => (
             <div key={sensor.id} className="border rounded-lg p-4 bg-white shadow">
               <h3 className="font-semibold text-lg">{sensor.friendlyName}</h3>
               <div className="text-sm text-gray-600">
                 <div>Type: {sensor.type}</div>
                 <div>Unit: {sensor.unit}</div>
               </div>
             </div>
           ))}
         </div>
       </main>
     );
   }
   ```

**Testing:**
- Run unit tests: `npm test`
- Start dev server: `npm run dev`
- Visit http://localhost:5173/ in browser
- Verify sensors are discovered and displayed with correct friendly names
- Check browser console for any errors

**Acceptance Criteria:**
- [ ] Unit tests pass
- [ ] Sensors are discovered from API via server-side loader (no CORS errors)
- [ ] Only temperature/humidity sensors are included
- [ ] Friendly names are correctly extracted
- [ ] Error handling works
- [ ] Page loads without client-side CORS issues

---

## Phase 2: Data Collection & Storage ✅ COMPLETED

### Step 4: Create In-Memory Data Store ✅
**Goal**: Build time-series data store with automatic retention  
**Duration**: 2 hours  
**Dependencies**: Step 1
**Status**: ✅ Complete

**Tasks:**
1. Create `app/services/storage/inMemoryStore.ts`:
   ```typescript
   import type { SensorReading } from '~/types/sensor';
   
   const MAX_RETENTION_DAYS = 30;
   const MAX_POINTS_PER_SENSOR = 50000;
   
   export class InMemoryDataStore {
     private data: Map<string, SensorReading[]> = new Map();
     
     add(reading: SensorReading): void {
       const sensorId = reading.sensorId;
       
       if (!this.data.has(sensorId)) {
         this.data.set(sensorId, []);
       }
       
       const readings = this.data.get(sensorId)!;
       readings.push(reading);
       
       // Prevent memory overflow
       if (readings.length > MAX_POINTS_PER_SENSOR) {
         readings.shift();
       }
     }
     
     getByTimeRange(
       sensorId: string,
       startDate: Date,
       endDate: Date
     ): SensorReading[] {
       const readings = this.data.get(sensorId) || [];
       
       return readings.filter(
         reading =>
           reading.timestamp >= startDate && reading.timestamp <= endDate
       );
     }
     
     getAll(sensorId: string): SensorReading[] {
       return this.data.get(sensorId) || [];
     }
     
     evictOldData(): number {
       const cutoffDate = new Date();
       cutoffDate.setDate(cutoffDate.getDate() - MAX_RETENTION_DAYS);
       
       let evictedCount = 0;
       
       for (const [sensorId, readings] of this.data.entries()) {
         const originalLength = readings.length;
         const filtered = readings.filter(
           reading => reading.timestamp >= cutoffDate
         );
         
         evictedCount += originalLength - filtered.length;
         this.data.set(sensorId, filtered);
       }
       
       return evictedCount;
     }
     
     clear(): void {
       this.data.clear();
     }
     
     getSensorIds(): string[] {
       return Array.from(this.data.keys());
     }
     
     getLatest(sensorId: string): SensorReading | undefined {
       const readings = this.data.get(sensorId);
       return readings?.[readings.length - 1];
     }
   }
   
   export const dataStore = new InMemoryDataStore();
   ```

2. Create comprehensive test file `app/services/storage/inMemoryStore.test.ts`:
   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest';
   import { InMemoryDataStore } from './inMemoryStore';
   import type { SensorReading } from '~/types/sensor';
   
   describe('InMemoryDataStore', () => {
     let store: InMemoryDataStore;
     
     beforeEach(() => {
       store = new InMemoryDataStore();
     });
     
     it('should store and retrieve sensor readings', () => {
       const reading: SensorReading = {
         sensorId: 'sensor1',
         timestamp: new Date('2025-11-09T10:00:00Z'),
         temperature: 20.5,
       };
       
       store.add(reading);
       const readings = store.getAll('sensor1');
       
       expect(readings).toHaveLength(1);
       expect(readings[0]).toEqual(reading);
     });
     
     it('should filter by time range', () => {
       const readings: SensorReading[] = [
         { sensorId: 's1', timestamp: new Date('2025-11-07T10:00:00Z'), temperature: 20 },
         { sensorId: 's1', timestamp: new Date('2025-11-08T10:00:00Z'), temperature: 21 },
         { sensorId: 's1', timestamp: new Date('2025-11-09T10:00:00Z'), temperature: 22 },
       ];
       
       readings.forEach(r => store.add(r));
       
       const filtered = store.getByTimeRange(
         's1',
         new Date('2025-11-08T00:00:00Z'),
         new Date('2025-11-09T00:00:00Z')
       );
       
       expect(filtered).toHaveLength(1);
       expect(filtered[0].temperature).toBe(21);
     });
     
     it('should evict data older than 30 days', () => {
       const oldReading: SensorReading = {
         sensorId: 's1',
         timestamp: new Date('2025-10-01T10:00:00Z'), // 39 days ago
         temperature: 20,
       };
       
       const recentReading: SensorReading = {
         sensorId: 's1',
         timestamp: new Date('2025-11-08T10:00:00Z'),
         temperature: 21,
       };
       
       store.add(oldReading);
       store.add(recentReading);
       
       const evicted = store.evictOldData();
       
       expect(evicted).toBe(1);
       expect(store.getAll('s1')).toHaveLength(1);
       expect(store.getAll('s1')[0].temperature).toBe(21);
     });
     
     it('should get latest reading', () => {
       store.add({ sensorId: 's1', timestamp: new Date('2025-11-08T10:00:00Z'), temperature: 20 });
       store.add({ sensorId: 's1', timestamp: new Date('2025-11-09T10:00:00Z'), temperature: 21 });
       
       const latest = store.getLatest('s1');
       
       expect(latest?.temperature).toBe(21);
     });
   });
   ```

**Testing:**
- Run unit tests: `npm test`
- Test with large datasets (mock 50k+ readings)
- Verify memory doesn't grow unbounded

**Acceptance Criteria:**
- [x] All unit tests pass
- [x] Data can be added and retrieved
- [x] Time range filtering works correctly
- [x] Old data eviction works (30 days)
- [x] Memory limits are enforced

---

### Step 5: Implement Data Collection Service ✅
**Goal**: Periodically fetch sensor data and store it  
**Duration**: 2 hours  
**Dependencies**: Step 2, 3, 4
**Status**: ✅ Complete

**Tasks:**
1. Create `app/services/dataCollection.ts`:
   ```typescript
   import type { Sensor, SensorReading } from '~/types/sensor';
   import { haClient } from './api/homeAssistantClient';
   import { dataStore } from './storage/inMemoryStore';
   
   export class DataCollectionService {
     private intervalId: NodeJS.Timeout | null = null;
     private isRunning = false;
     
     private async fetchSensorData(sensor: Sensor): Promise<SensorReading | null> {
       try {
         const state = await haClient.getSensorState(sensor.entityId);
         const value = parseFloat(state.state);
         
         if (isNaN(value)) {
           console.warn(`Invalid value for sensor ${sensor.entityId}: ${state.state}`);
           return null;
         }
         
         const reading: SensorReading = {
           sensorId: sensor.id,
           timestamp: new Date(state.last_updated),
         };
         
         if (sensor.type === 'temperature' || sensor.type === 'both') {
           reading.temperature = value;
         }
         if (sensor.type === 'humidity' || sensor.type === 'both') {
           reading.humidity = value;
         }
         
         return reading;
       } catch (error) {
         console.error(`Failed to fetch data for sensor ${sensor.entityId}:`, error);
         return null;
       }
     }
     
     async collectData(sensors: Sensor[]): Promise<void> {
       const readings = await Promise.all(
         sensors.map(sensor => this.fetchSensorData(sensor))
       );
       
       readings.forEach(reading => {
         if (reading) {
           dataStore.add(reading);
         }
       });
     }
     
     start(sensors: Sensor[], intervalMs: number = 60000): void {
       if (this.isRunning) {
         console.warn('Data collection already running');
         return;
       }
       
       this.isRunning = true;
       
       // Collect immediately
       this.collectData(sensors);
       
       // Then collect at interval
       this.intervalId = setInterval(() => {
         this.collectData(sensors);
       }, intervalMs);
       
       console.log(`Data collection started (interval: ${intervalMs}ms)`);
     }
     
     stop(): void {
       if (this.intervalId) {
         clearInterval(this.intervalId);
         this.intervalId = null;
       }
       this.isRunning = false;
       console.log('Data collection stopped');
     }
     
     isCollecting(): boolean {
       return this.isRunning;
     }
   }
   
   export const dataCollection = new DataCollectionService();
   ```

2. Create hook `app/hooks/useDataCollection.ts`:
   ```typescript
   import { useEffect } from 'react';
   import type { Sensor } from '~/types/sensor';
   import { dataCollection } from '~/services/dataCollection';
   
   const COLLECTION_INTERVAL_MS = 60 * 1000; // 1 minute
   
   export function useDataCollection(sensors: Sensor[]) {
     useEffect(() => {
       if (sensors.length === 0) return;
       
       dataCollection.start(sensors, COLLECTION_INTERVAL_MS);
       
       return () => {
         dataCollection.stop();
       };
     }, [sensors]);
   }
   ```

**Note**: Data collection will also need to use server-side APIs. In Step 5, we'll refactor this to use React Router's revalidation or a separate API route to avoid CORS issues.

3. Create hook to access stored data `app/hooks/useDataStore.ts`:
   ```typescript
   import { useState, useEffect } from 'react';
   import type { SensorReading } from '~/types/sensor';
   import { dataStore } from '~/services/storage/inMemoryStore';
   
   export function useDataStore(sensorId: string, startDate?: Date, endDate?: Date) {
     const [data, setData] = useState<SensorReading[]>([]);
     
     useEffect(() => {
       const fetchData = () => {
         if (startDate && endDate) {
           setData(dataStore.getByTimeRange(sensorId, startDate, endDate));
         } else {
           setData(dataStore.getAll(sensorId));
         }
       };
       
       fetchData();
       
       // Poll for updates every 10 seconds
       const intervalId = setInterval(fetchData, 10000);
       
       return () => clearInterval(intervalId);
     }, [sensorId, startDate, endDate]);
     
     return data;
   }
   ```

**Testing:**
- Create a test route that shows live data collection
- Verify data is collected every minute
- Check that data appears in the store
- Verify cleanup on unmount

**Acceptance Criteria:**
- [x] Data collection starts automatically
- [x] Data is fetched every 1 minute
- [x] Data is stored in the data store
- [x] Collection stops when component unmounts
- [x] Error handling doesn't crash the app

---

### Step 6: Implement Automatic Data Eviction ✅
**Goal**: Set up background task to evict old data  
**Duration**: 1 hour  
**Dependencies**: Step 4
**Status**: ✅ Complete

**Tasks:**
1. Create `app/services/dataRetention.ts`:
   ```typescript
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
   ```

2. Create hook `app/hooks/useDataRetention.ts`:
   ```typescript
   import { useEffect } from 'react';
   import { dataRetention } from '~/services/dataRetention';
   
   export function useDataRetention() {
     useEffect(() => {
       dataRetention.start();
       
       return () => {
         dataRetention.stop();
       };
     }, []);
   }
   ```

**Testing:**
- Manually trigger eviction with old test data
- Verify eviction runs automatically
- Check console logs for eviction activity

**Acceptance Criteria:**
- [x] Eviction runs automatically every hour
- [x] Old data (>30 days) is removed
- [x] Service starts and stops cleanly

---

## Phase 3: UI Components

### Step 7: Create Sensor List Component
**Goal**: Display all discovered sensors  
**Duration**: 1.5 hours  
**Dependencies**: Step 3

**Tasks:**
1. Create `app/components/SensorCard.tsx`:
   ```typescript
   import type { Sensor } from '~/types/sensor';
   
   interface SensorCardProps {
     sensor: Sensor;
     currentTemp?: number;
     currentHumidity?: number;
     onSelect: (sensor: Sensor) => void;
   }
   
   export function SensorCard({
     sensor,
     currentTemp,
     currentHumidity,
     onSelect,
   }: SensorCardProps) {
     const statusColor = {
       online: 'bg-green-500',
       offline: 'bg-gray-500',
       error: 'bg-red-500',
     }[sensor.status];
     
     return (
       <div
         className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
         onClick={() => onSelect(sensor)}
       >
         <div className="flex items-center justify-between mb-2">
           <h3 className="font-semibold text-lg">{sensor.friendlyName}</h3>
           <span className={`w-3 h-3 rounded-full ${statusColor}`} />
         </div>
         
         <div className="space-y-1 text-sm">
           {currentTemp !== undefined && (
             <div className="flex justify-between">
               <span className="text-gray-600">Temperature:</span>
               <span className="font-medium">{currentTemp.toFixed(1)} {sensor.unit}</span>
             </div>
           )}
           {currentHumidity !== undefined && (
             <div className="flex justify-between">
               <span className="text-gray-600">Humidity:</span>
               <span className="font-medium">{currentHumidity.toFixed(1)}%</span>
             </div>
           )}
           <div className="text-xs text-gray-500 mt-2">
             Last seen: {sensor.lastSeen.toLocaleString()}
           </div>
         </div>
       </div>
     );
   }
   ```

2. Create `app/components/SensorList.tsx`:
   ```typescript
   import type { Sensor } from '~/types/sensor';
   import { SensorCard } from './SensorCard';
   import { dataStore } from '~/services/storage/inMemoryStore';
   import { useState, useEffect } from 'react';
   
   interface SensorListProps {
     sensors: Sensor[];
     onSensorSelect: (sensor: Sensor) => void;
   }
   
   export function SensorList({ sensors, onSensorSelect }: SensorListProps) {
     const [currentValues, setCurrentValues] = useState<Map<string, any>>(new Map());
     
     useEffect(() => {
       const updateValues = () => {
         const values = new Map();
         sensors.forEach(sensor => {
           const latest = dataStore.getLatest(sensor.id);
           if (latest) {
             values.set(sensor.id, latest);
           }
         });
         setCurrentValues(values);
       };
       
       updateValues();
       const intervalId = setInterval(updateValues, 5000);
       
       return () => clearInterval(intervalId);
     }, [sensors]);
     
     if (sensors.length === 0) {
       return (
         <div className="text-center py-12">
           <p className="text-gray-500">No sensors found</p>
         </div>
       );
     }
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {sensors.map(sensor => {
           const values = currentValues.get(sensor.id);
           return (
             <SensorCard
               key={sensor.id}
               sensor={sensor}
               currentTemp={values?.temperature}
               currentHumidity={values?.humidity}
               onSelect={onSensorSelect}
             />
           );
         })}
       </div>
     );
   }
   ```

**Testing:**
- Render sensor list in home route
- Verify sensors display with friendly names
- Check current values update
- Test on mobile viewport

**Acceptance Criteria:**
- [ ] All sensors are displayed
- [ ] Current values show and update
- [ ] Status indicators work
- [ ] Responsive on mobile
- [ ] Click handlers work

---

### Step 8: Install and Configure Charting Library
**Goal**: Set up Recharts for data visualization  
**Duration**: 30 minutes  
**Dependencies**: None

**Tasks:**
1. Install Recharts:
   ```bash
   npm install recharts
   npm install -D @types/recharts
   ```

2. Create utility for chart data formatting `app/utils/chartFormatters.ts`:
   ```typescript
   import type { SensorReading } from '~/types/sensor';
   
   export interface ChartDataPoint {
     timestamp: number;
     time: string;
     temperature?: number;
     humidity?: number;
   }
   
   export function formatReadingsForChart(
     readings: SensorReading[]
   ): ChartDataPoint[] {
     return readings.map(reading => ({
       timestamp: reading.timestamp.getTime(),
       time: reading.timestamp.toLocaleTimeString(),
       temperature: reading.temperature,
       humidity: reading.humidity,
     }));
   }
   
   export function formatXAxisTick(timestamp: number): string {
     const date = new Date(timestamp);
     return date.toLocaleDateString('en-US', {
       month: 'short',
       day: 'numeric',
       hour: '2-digit',
     });
   }
   ```

**Testing:**
- Run TypeScript compilation
- Test utility functions with sample data

**Acceptance Criteria:**
- [ ] Recharts installed successfully
- [ ] Utility functions work correctly
- [ ] No TypeScript errors

---

### Step 9: Create Sensor Chart Component
**Goal**: Build interactive chart for individual sensors  
**Duration**: 2.5 hours  
**Dependencies**: Step 7, 8

**Tasks:**
1. Create time range utilities `app/utils/timeUtils.ts`:
   ```typescript
   export function getDateRange(days: number): { start: Date; end: Date } {
     const end = new Date();
     const start = new Date();
     start.setDate(start.getDate() - days);
     
     return { start, end };
   }
   
   export function getLast3Days(): { start: Date; end: Date } {
     return getDateRange(3);
   }
   
   export function getLast7Days(): { start: Date; end: Date } {
     return getDateRange(7);
   }
   
   export function getLast30Days(): { start: Date; end: Date } {
     return getDateRange(30);
   }
   ```

2. Create `app/components/SensorChart.tsx`:
   ```typescript
   import { useMemo } from 'react';
   import {
     LineChart,
     Line,
     XAxis,
     YAxis,
     CartesianGrid,
     Tooltip,
     Legend,
     ResponsiveContainer,
   } from 'recharts';
   import type { Sensor } from '~/types/sensor';
   import { useDataStore } from '~/hooks/useDataStore';
   import { formatReadingsForChart, formatXAxisTick } from '~/utils/chartFormatters';
   import { getLast3Days } from '~/utils/timeUtils';
   
   interface SensorChartProps {
     sensor: Sensor;
   }
   
   export function SensorChart({ sensor }: SensorChartProps) {
     const { start, end } = getLast3Days();
     const readings = useDataStore(sensor.id, start, end);
     
     const chartData = useMemo(
       () => formatReadingsForChart(readings),
       [readings]
     );
     
     if (chartData.length === 0) {
       return (
         <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
           <p className="text-gray-500">No data available</p>
         </div>
       );
     }
     
     return (
       <div className="w-full">
         <h2 className="text-xl font-bold mb-4">{sensor.friendlyName}</h2>
         
         <ResponsiveContainer width="100%" height={400}>
           <LineChart data={chartData}>
             <CartesianGrid strokeDasharray="3 3" />
             <XAxis
               dataKey="timestamp"
               tickFormatter={formatXAxisTick}
               scale="time"
               type="number"
               domain={['dataMin', 'dataMax']}
             />
             <YAxis yAxisId="left" />
             {sensor.type === 'both' && <YAxis yAxisId="right" orientation="right" />}
             <Tooltip
               labelFormatter={(value) => new Date(value).toLocaleString()}
             />
             <Legend />
             
             {(sensor.type === 'temperature' || sensor.type === 'both') && (
               <Line
                 yAxisId="left"
                 type="monotone"
                 dataKey="temperature"
                 stroke="#ef4444"
                 name={`Temperature (${sensor.unit})`}
                 dot={false}
                 strokeWidth={2}
               />
             )}
             
             {(sensor.type === 'humidity' || sensor.type === 'both') && (
               <Line
                 yAxisId={sensor.type === 'both' ? 'right' : 'left'}
                 type="monotone"
                 dataKey="humidity"
                 stroke="#3b82f6"
                 name="Humidity (%)"
                 dot={false}
                 strokeWidth={2}
               />
             )}
           </LineChart>
         </ResponsiveContainer>
         
         <div className="mt-2 text-sm text-gray-600 text-center">
           Showing last 3 days • {chartData.length} data points
         </div>
       </div>
     );
   }
   ```

**Testing:**
- Render chart with sample data
- Verify chart displays correctly
- Test on mobile (responsive)
- Verify tooltips and legend work
- Check dual Y-axis for sensors with both temp and humidity

**Acceptance Criteria:**
- [ ] Chart renders with data
- [ ] Shows 3-day time range
- [ ] Temperature and humidity lines display correctly
- [ ] Tooltips show exact values
- [ ] Responsive on mobile
- [ ] Updates when new data arrives

---

### Step 10: Integrate Components in Main Route
**Goal**: Wire everything together in the home route  
**Duration**: 1 hour  
**Dependencies**: All previous steps

**Tasks:**
1. Update `app/routes/home.tsx`:
   ```typescript
   import { useState } from 'react';
   import type { Sensor } from '~/types/sensor';
   import { useSensorDiscovery } from '~/hooks/useSensorDiscovery';
   import { useDataCollection } from '~/hooks/useDataCollection';
   import { useDataRetention } from '~/hooks/useDataRetention';
   import { SensorList } from '~/components/SensorList';
   import { SensorChart } from '~/components/SensorChart';
   
   export default function Home() {
     const { sensors, isLoading, error } = useSensorDiscovery();
     const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
     
     // Start data collection
     useDataCollection(sensors);
     
     // Start data retention/eviction
     useDataRetention();
     
     if (isLoading) {
       return (
         <div className="flex items-center justify-center min-h-screen">
           <div className="text-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
             <p className="text-gray-600">Discovering sensors...</p>
           </div>
         </div>
       );
     }
     
     if (error) {
       return (
         <div className="flex items-center justify-center min-h-screen">
           <div className="text-center text-red-600">
             <p className="font-semibold mb-2">Error loading sensors</p>
             <p className="text-sm">{error.message}</p>
           </div>
         </div>
       );
     }
     
     return (
       <div className="container mx-auto px-4 py-8">
         <header className="mb-8">
           <h1 className="text-3xl font-bold mb-2">Sensor Monitor</h1>
           <p className="text-gray-600">
             {sensors.length} sensor{sensors.length !== 1 ? 's' : ''} active
           </p>
         </header>
         
         {selectedSensor ? (
           <div>
             <button
               onClick={() => setSelectedSensor(null)}
               className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
             >
               ← Back to sensor list
             </button>
             <SensorChart sensor={selectedSensor} />
           </div>
         ) : (
           <SensorList sensors={sensors} onSensorSelect={setSelectedSensor} />
         )}
       </div>
     );
   }
   ```

**Testing:**
- Load the application
- Verify sensors are discovered
- Click on a sensor to view chart
- Navigate back to list
- Test on mobile device
- Leave running for 1+ minutes to verify data collection

**Acceptance Criteria:**
- [ ] Sensors are discovered and displayed
- [ ] Data collection starts automatically
- [ ] Clicking sensor shows chart
- [ ] Chart shows 3-day data
- [ ] Back navigation works
- [ ] Mobile responsive
- [ ] Loading and error states work

---

## Phase 4: Testing & Refinement

### Step 11: Write Integration Tests
**Goal**: Test complete user workflows  
**Duration**: 2 hours  
**Dependencies**: Step 10

**Tasks:**
1. Create `app/routes/home.test.tsx`:
   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   import { render, screen, waitFor } from '@testing-library/react';
   import { userEvent } from '@testing-library/user-event';
   import Home from './home';
   
   vi.mock('~/hooks/useSensorDiscovery');
   vi.mock('~/hooks/useDataCollection');
   vi.mock('~/hooks/useDataRetention');
   
   describe('Home Route Integration', () => {
     it('should display sensors after discovery', async () => {
       const mockSensors = [
         {
           id: 'sensor1',
           entityId: 'sensor.temp1',
           friendlyName: 'Living Room',
           type: 'temperature',
           unit: '°C',
           status: 'online',
           lastSeen: new Date(),
         },
       ];
       
       const { useSensorDiscovery } = await import('~/hooks/useSensorDiscovery');
       (useSensorDiscovery as any).mockReturnValue({
         sensors: mockSensors,
         isLoading: false,
         error: null,
       });
       
       render(<Home />);
       
       await waitFor(() => {
         expect(screen.getByText('Living Room')).toBeInTheDocument();
       });
     });
   });
   ```

2. Run full test suite and fix any issues

**Testing:**
- Run `npm test`
- Fix any failing tests
- Achieve >80% coverage for critical paths

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Integration tests cover main workflows
- [ ] Test coverage is adequate

---

### Step 12: Performance Optimization
**Goal**: Ensure smooth performance with real data  
**Duration**: 1.5 hours  
**Dependencies**: Step 10

**Tasks:**
1. Add React.memo to expensive components:
   ```typescript
   export const SensorChart = React.memo(SensorChartComponent);
   export const SensorCard = React.memo(SensorCardComponent);
   ```

2. Optimize data store queries with indexing if needed

3. Test with multiple sensors and large datasets

4. Profile with React DevTools

**Testing:**
- Load with 10+ sensors
- Monitor for 1+ hours
- Check memory usage
- Verify smooth chart updates

**Acceptance Criteria:**
- [ ] No memory leaks
- [ ] Smooth chart rendering (60fps)
- [ ] Data updates don't cause jank
- [ ] Works with 10+ sensors

---

### Step 13: Mobile Responsive Polish
**Goal**: Perfect mobile experience  
**Duration**: 1 hour  
**Dependencies**: Step 10

**Tasks:**
1. Test on actual mobile devices
2. Adjust touch targets (minimum 44x44px)
3. Optimize chart size for small screens
4. Test landscape orientation
5. Verify scrolling works smoothly

**Testing:**
- Test on iPhone and Android
- Test various screen sizes
- Verify all interactions work

**Acceptance Criteria:**
- [ ] Fully usable on mobile
- [ ] Touch targets are large enough
- [ ] Charts are readable on small screens
- [ ] No horizontal scrolling issues

---

## Phase 5: Documentation & Deployment

### Step 14: Documentation
**Goal**: Document setup and usage  
**Duration**: 1 hour  
**Dependencies**: None

**Tasks:**
1. Update README.md with:
   - Setup instructions
   - Environment variables needed
   - How to run locally
   - Architecture overview

2. Add code comments for complex logic

**Acceptance Criteria:**
- [ ] README is complete
- [ ] Setup instructions work
- [ ] Complex code is commented

---

### Step 15: Deployment Preparation
**Goal**: Prepare for production deployment  
**Duration**: 1 hour  
**Dependencies**: All previous steps

**Tasks:**
1. Create `.env.example` file
2. Update Docker configuration if needed
3. Test production build
4. Verify environment variables work

**Testing:**
- Run production build locally
- Test with production-like config

**Acceptance Criteria:**
- [ ] Production build works
- [ ] Environment variables configured
- [ ] Docker setup works (if applicable)

---

## Summary

### Total Estimated Time
- Phase 1: 6 hours
- Phase 2: 8 hours
- Phase 3: 7.5 hours
- Phase 4: 4.5 hours
- Phase 5: 2 hours
- **Total: ~28 hours** (3-4 working days)

### Testing Checkpoints
After each step, verify:
1. All tests pass (`npm test`)
2. TypeScript compiles (`npx tsc --noEmit`)
3. Application runs without errors
4. New functionality works as expected

### Key Success Metrics
- [ ] All sensors discovered dynamically
- [ ] Data collected every 1 minute
- [ ] Data stored for 30 days
- [ ] Charts display 3-day view by default
- [ ] Fully responsive on mobile
- [ ] >80% test coverage
- [ ] No memory leaks

### Next Steps (Future Features)
- Implement time range selection (Step 16)
- Add multi-sensor aggregated charts (Step 17)
- Implement light/dark mode (Step 18)
