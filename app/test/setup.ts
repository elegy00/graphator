import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for tests
process.env.HA_URL = 'http://test-ha:8123';
process.env.HA_AUTH_TOKEN = 'test-token';
