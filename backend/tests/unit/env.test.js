import { describe, expect, it } from 'vitest';
import { validateEnv } from '../../src/config/env.js';

describe('Environment validation (validateEnv)', () => {
  it('successfully validates complete, valid configuration', () => {
    const validConfig = {
      PORT: '5000',
      NODE_ENV: 'development',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/cardbridge_test',
      CLIENT_ORIGIN: 'http://localhost:5173',
    };

    const result = validateEnv(validConfig);
    expect(result.PORT).toBe(5000);
    expect(result.NODE_ENV).toBe('development');
    expect(result.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/cardbridge_test');
    expect(result.CLIENT_ORIGIN).toBe('http://localhost:5173');
  });

  it('throws ConfigError when MONGODB_URI is missing', () => {
    const invalidConfig = {
      PORT: '5000',
      CLIENT_ORIGIN: 'http://localhost:5173',
    };

    expect(() => validateEnv(invalidConfig)).toThrowError(/MONGODB_URI is required/);
  });

  it('throws ConfigError when CLIENT_ORIGIN is missing', () => {
    const invalidConfig = {
      PORT: '5000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/cardbridge_test',
    };

    expect(() => validateEnv(invalidConfig)).toThrowError(/CLIENT_ORIGIN is required/);
  });

  it('applies defaults for PORT and NODE_ENV when not provided', () => {
    const minimalConfig = {
      MONGODB_URI: 'mongodb://127.0.0.1:27017/cardbridge_test',
      CLIENT_ORIGIN: 'http://localhost:5173',
    };

    const result = validateEnv(minimalConfig);
    expect([5000, 5001]).toContain(result.PORT);
    expect(result.NODE_ENV).toBe('development');
  });
});

