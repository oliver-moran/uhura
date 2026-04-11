import { console, native, LogLevel } from '../dist/uhura.min.js';
import { expect, jest } from '@jest/globals';

describe('Callback functionality', () => {

  beforeAll(() => {
    console({
      /* The callback should be called regardless of the log level. */
      level: LogLevel.NONE,
      count: false,
      time: false,
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

  test('Callback function is called for dir', () => {
    const callbackMock = jest.fn();
    console({ callback: callbackMock });

    const obj = { name: 'Test Object', value: 42 };
    console.dir(obj);
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.LOG, ['Test Object', 42]);
  });
  
  test('Callback function is called for tables', () => {
    const callbackMock = jest.fn();
    console({ callback: callbackMock });

    const alice = { name: 'Alice', age: 30, location: 'Wonderland' };
    const bob = { name: 'Bob', age: 25 };

    console.table([alice, bob]);
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.LOG, new Map([
      ['0', alice],
      ['1', bob]
    ]));

    console.table({female: alice, male: bob});
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.LOG, new Map([
      ['female', alice],
      ['male', bob]
    ]));

    console.table([alice, bob], ['name']);
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.LOG, new Map([
      ['0', { name: 'Alice' }],
      ['1', { name: 'Bob' }]
    ]));

    console.table({ female: alice, male: bob }, ['name']);
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.LOG, new Map([
      ['female', { name: 'Alice' }],
      ['male', { name: 'Bob' }]
    ]));
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

  test('Callback function is called for traces', () => {
    const callbackMock = jest.fn();
    console({ callback: callbackMock });

    console.trace('This is a trace', { some: 'data' });
    expect(callbackMock).toHaveBeenCalledWith(LogLevel.DEBUG, [
      expect.any(String), 'This is a trace', { some: 'data' }
    ]);
  });

  test('Errors in callback do not affect logging', () => {
    const callbackErrorMock = jest.fn(() => { throw new Error('Callback error'); });
    console({ callback: callbackErrorMock });

    expect(() => console.log('This should still log')).not.toThrow();
    expect(callbackErrorMock).toHaveBeenCalledWith(LogLevel.LOG, ['This should still log']);
    expect(error).toHaveBeenCalledWith(expect.any(Error));
  });

});