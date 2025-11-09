import type { HomeAssistantState } from '~/types/sensor';

export class HomeAssistantClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
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
