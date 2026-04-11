import { console, native, LogLevel, LogLabel } from '../dist/uhura.min.js';
import { expect, jest } from '@jest/globals';

describe('Logging levels', () => {
  let log;
  let debug;
  let info;
  let warn;
  let error;

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

  test('Logging levels have correct labels', () => {
    expect(LogLabel[LogLevel.LOG]).toBe('LOG');
    expect(LogLabel[LogLevel.DEBUG]).toBe('DEBUG');
    expect(LogLabel[LogLevel.INFO]).toBe('INFO');
    expect(LogLabel[LogLevel.WARN]).toBe('WARN');
    expect(LogLabel[LogLevel.ERROR]).toBe('ERROR');
    expect(LogLabel[LogLevel.COUNT]).toBe('COUNT');
    expect(LogLabel[LogLevel.TIME]).toBe('TIME');        
  });

  test('Console logs messages with correct formatting', () => {
    console({ level: LogLevel.LOG });

    console.log('Formatted message');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.LOG]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.debug('Formatted message');
    expect(debug).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.DEBUG]));
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.info('Formatted message');
    expect(info).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.INFO]));
    expect(info).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.warn('Formatted message');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.WARN]));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.error('Formatted message');
    expect(error).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.ERROR]));
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));
  });

  test('Assert logs an error when the condition is false, and not when true', () => {
    console({ level: LogLevel.ERROR });
    console.assert(false, 'Assertion failed');
    expect(error).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.ERROR]));
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Assertion failed'));

    console.assert(true, 'This should not be logged');
    expect(error).not.toHaveBeenCalledWith(expect.stringContaining('This should not be logged'));
  });

  test('Table logs objects in a tabular format', () => {
    console({ level: LogLevel.LOG });
    const data = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];
    console.table(data);
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.LOG]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Bob'));
  });

  test('Dir logs object properties', () => {
    console({ level: LogLevel.LOG });
    const obj = { name: 'Alice', age: 30 };
    console.dir(obj);
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.LOG]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('(string)'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('name'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('(number)'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('age'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('30'));
  });

  test('Trace logs the stack trace', () => {
    console({ level: LogLevel.DEBUG });
    console.trace('Trace message', { some: 'data' });
    expect(debug).toHaveBeenCalledWith(expect.stringContaining(LogLabel[LogLevel.DEBUG]));
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('Trace message'));
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('data')); // The object should be logged
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('at')); // Stack trace should contain 'at' lines
  });
  
  test('Logs messages at the correct log level', () => {
    console({ level: LogLevel.DEBUG });
    console.log('This is a log message');
    expect(log).not.toHaveBeenCalled();

    console({ level: LogLevel.INFO });
    console.debug('This is a debug message');
    expect(debug).not.toHaveBeenCalled();

    console({ level: LogLevel.WARN });
    console.info('This is a info message');
    expect(info).not.toHaveBeenCalled();

    console({ level: LogLevel.ERROR });
    console.warn('This is a error message');
    expect(warn).not.toHaveBeenCalled();

    console({ level: LogLevel.NONE });
    console.error('This is a error message');
    expect(error).not.toHaveBeenCalled();
  });

});