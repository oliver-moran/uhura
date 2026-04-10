import { console, native, LogLevel } from '../dist/uhura.min.js';
import { expect, jest } from '@jest/globals';

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
    debug = jest.spyOn(global.console, 'debug').mockImplementation(() => {});
    info = jest.spyOn(global.console, 'info').mockImplementation(() => {});
    warn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    error = jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
    debug.mockRestore();
    info.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });

  test('Callback function is called', () => {
    const callbackMock = jest.fn();
    console({ callback: callbackMock });

    console.log('Saving this log');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.LOG, ['Saving this log']);

    console.debug('Saving this debug');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.DEBUG, ['Saving this debug']);

    console.info('Saving this info');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.INFO, ['Saving this info']);

    console.warn('Saving this warn');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.WARN, ['Saving this warn']);

    console.error('Saving this error');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.ERROR, ['Saving this error']);
    
  });

  test('Callback function is called for timers', () => {
    const callbackMock = jest.fn();
    console({ callback: callbackMock });

    console.time('myTimer');
    expect(callbackMock).not.toHaveBeenCalled();

    console.timeLog('myTimer', 'Halfway there...');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.TIME, ['myTimer', expect.any(Number), 'Halfway there...']);

    console.timeEnd('myTimer');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.TIME, ['myTimer', expect.any(Number)]);
  });

  test('Callback function is called for counters', () => {
    const callbackMock = jest.fn();
    console({ callback: callbackMock });

    console.count('myCounter');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.COUNT, ['myCounter', 1]);

    console.count('myCounter');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.COUNT, ['myCounter', 2]);

    console.countReset('myCounter');
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.COUNT, ['myCounter', 0]);
  });

  test('Errors in callback do not affect logging', () => {
    const callbackErrorMock = jest.fn(() => { throw new Error('Callback error'); });
    console({ callback: callbackErrorMock });

    expect(() => console.log('This should still log')).not.toThrow();
    expect(callbackErrorMock).toHaveBeenCalledWith(LogLevel.LOG, ['This should still log']);
    expect(error).toHaveBeenCalledWith(expect.any(Error));
  });

});