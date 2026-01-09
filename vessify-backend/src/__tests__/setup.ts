import { config } from 'dotenv';
import { jest } from '@jest/globals';
config();

// Increase timeout for API calls
jest.setTimeout(30000);
