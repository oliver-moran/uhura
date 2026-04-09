import { console, native, LogLevel } from '../dist/uhura.min.js';
import { jest } from '@jest/globals';

describe('Native functionality', () => {

  beforeAll(() => {
    console({
      level: LogLevel.LOG,
      count: true,
      time: true,
      trace: true,
      callback: (level, args) => {}
    });
  });

  beforeEach(() => {
    log = jest.spyOn(global.console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  test('uhura replaces the native console', () => {
    expect(console).not.toBe(global.console);
  });

  test('The native console is still accessible via the native export', () => {
    expect(native).toBe(global.console);
  });

  test('The native console can be used to log messages', () => {
    native.log('This is a message from the native console');
    expect(log).toHaveBeenCalledWith('This is a message from the native console');
  });

  test('The native console is accessible, even when uhura logging is disabled', () => {
    console({ level: LogLevel.NONE });

    console.log('This will not be logged because the log level is set to NONE');
    expect(log).not.toHaveBeenCalled();

    native.log('This is a message from the native console');
    expect(log).toHaveBeenCalledWith('This is a message from the native console');
  });

});