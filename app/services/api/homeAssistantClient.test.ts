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

  it('should fetch a single sensor state', async () => {
    const mockState = { entity_id: 'sensor.test', state: '20.5' };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockState,
    });

    const client = new HomeAssistantClient('http://test', 'token');
    const state = await client.getSensorState('sensor.test');

    expect(state).toEqual(mockState);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test/api/states/sensor.test',
      expect.any(Object)
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

  it('should include authorization header', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const client = new HomeAssistantClient('http://test', 'my-secret-token');
    await client.getAllStates();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer my-secret-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
