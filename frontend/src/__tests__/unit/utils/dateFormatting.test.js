/**
 * Date formatting utility tests
 * Created: June 11, 2025
 * 
 * Tests the formatDateSafe utility and Tabulator date formatting integration
 */

import { formatDateSafe } from '../../../utils/dateUtils';
import * as luxon from 'luxon';

// Mock luxon for testing
jest.mock('luxon', () => {
  const originalLuxon = jest.requireActual('luxon');
  return {
    ...originalLuxon,
    DateTime: {
      ...originalLuxon.DateTime,
      fromISO: jest.fn(),
    }
  };
});

describe('Date Formatting Utilities', () => {
  beforeEach(() => {
    // Reset window.luxon for each test
    window.luxon = undefined;
    // Reset the mock implementation
    luxon.DateTime.fromISO.mockReset();
  });

  test('formatDateSafe handles valid ISO date strings', () => {
    // Setup
    const mockDateTime = { isValid: true, toFormat: jest.fn().mockReturnValue('01 Jun 2025 14:30') };
    luxon.DateTime.fromISO.mockReturnValue(mockDateTime);
    window.luxon = luxon;
    
    // Execute
    const result = formatDateSafe('2025-06-01T14:30:00.000Z');
    
    // Verify
    expect(luxon.DateTime.fromISO).toHaveBeenCalledWith('2025-06-01T14:30:00.000Z');
    expect(mockDateTime.toFormat).toHaveBeenCalled();
    expect(result).toBe('01 Jun 2025 14:30');
  });

  test('formatDateSafe falls back to native Date when Luxon is unavailable', () => {
    // Setup - no window.luxon
    window.luxon = undefined;
    const mockDate = new Date('2025-06-01T14:30:00.000Z');
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    const mockToLocaleString = jest.fn().mockReturnValue('6/1/2025, 2:30:00 PM');
    mockDate.toLocaleString = mockToLocaleString;
    
    // Execute
    const result = formatDateSafe('2025-06-01T14:30:00.000Z');
    
    // Verify
    expect(mockToLocaleString).toHaveBeenCalled();
    expect(result).toBe('6/1/2025, 2:30:00 PM');
    
    // Cleanup
    spy.mockRestore();
  });

  test('formatDateSafe handles Luxon parsing errors', () => {
    // Setup - mock Luxon error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    luxon.DateTime.fromISO.mockImplementation(() => {
      throw new Error('Luxon parsing error');
    });
    window.luxon = luxon;
    
    // Execute
    const result = formatDateSafe('invalid-date');
    
    // Verify
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toBe(''); // Should return empty string on error
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  test('formatDateSafe returns empty string for null/undefined input', () => {
    expect(formatDateSafe(null)).toBe('');
    expect(formatDateSafe(undefined)).toBe('');
    expect(formatDateSafe('')).toBe('');
  });

  test('formatDateSafe handles invalid date strings gracefully', () => {
    // Setup
    window.luxon = luxon;
    luxon.DateTime.fromISO.mockReturnValue({ isValid: false });
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => ({ getTime: () => NaN }));
    
    // Execute
    const result = formatDateSafe('not-a-date');
    
    // Verify
    expect(result).toBe('');
    
    // Cleanup
    spy.mockRestore();
  });
});
