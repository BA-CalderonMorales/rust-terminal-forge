import { describe, it, expect, beforeAll } from 'vitest';

describe('Backend Integration Tests', () => {
  const API_BASE_URL = 'http://localhost:3001';
  const PTY_BASE_URL = 'http://localhost:3002';
  const FRONTEND_URL = 'http://localhost:8080';

  describe('API Server Health Check', () => {
    it('should respond to health check endpoint', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('Rick\'s Rust backend is ALIVE!');
    });

    it('should have proper response headers', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('PTY Server Health Check', () => {
    it('should respond to health check endpoint', async () => {
      const response = await fetch(`${PTY_BASE_URL}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('activeSessions');
      expect(typeof data.activeSessions).toBe('number');
    });

    it('should have CORS headers configured', async () => {
      const response = await fetch(`${PTY_BASE_URL}/health`);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });

  describe('Frontend to Backend Connectivity', () => {
    it('should proxy API requests through Vite', async () => {
      // Test the proxy configuration by making a request to the frontend
      const response = await fetch(`${FRONTEND_URL}/api/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
    });

    it('should proxy PTY health requests through Vite', async () => {
      const response = await fetch(`${FRONTEND_URL}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('activeSessions');
    });
  });

  describe('Service Discovery', () => {
    it('should have all required services running on expected ports', async () => {
      const services = [
        { name: 'API Server', url: `${API_BASE_URL}/api/health` },
        { name: 'PTY Server', url: `${PTY_BASE_URL}/health` },
        { name: 'Frontend', url: FRONTEND_URL }
      ];

      for (const service of services) {
        try {
          const response = await fetch(service.url);
          expect(response.status).toBeLessThan(400);
        } catch (error) {
          throw new Error(`${service.name} is not accessible at ${service.url}: ${error}`);
        }
      }
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent JSON format from API health endpoint', async () => {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      
      // Validate expected fields
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      
      // Validate data types
      expect(typeof data.message).toBe('string');
      expect(typeof data.status).toBe('string');
      expect(typeof data.timestamp).toBe('string');
      
      // Validate timestamp format - should be parseable as a valid date
      expect(new Date(data.timestamp).getTime()).not.toBeNaN();
    });

    it('should return consistent JSON format from PTY health endpoint', async () => {
      const response = await fetch(`${PTY_BASE_URL}/health`);
      const data = await response.json();
      
      // Validate expected fields
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('activeSessions');
      expect(data).toHaveProperty('timestamp');
      
      // Validate data types
      expect(typeof data.status).toBe('string');
      expect(typeof data.activeSessions).toBe('number');
      expect(typeof data.timestamp).toBe('string');
      
      // Validate values
      expect(data.status).toBe('ok');
      expect(data.activeSessions).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS for cross-origin requests', async () => {
      const response = await fetch(`${PTY_BASE_URL}/health`, {
        headers: {
          'Origin': 'http://localhost:8080'
        }
      });
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
  });
});