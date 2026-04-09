import { console, native, LogLevel } from '../dist/uhura.min.js';
import { jest } from '@jest/globals';

describe('Logging levels', () => {
  let log;
  let debug;
  let info;
  let warn;
  let error;

  beforeAll(() => {
    console({ level: LogLevel.LOG, time: true, trace: true, callback: (level, args) => {} });
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

  test('Console logs messages with correct formatting', () => {
    console({ level: LogLevel.LOG });

    console.log('Formatted message');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('LOG'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.debug('Formatted message');
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
    expect(debug).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.info('Formatted message');
    expect(info).toHaveBeenCalledWith(expect.stringContaining('INFO'));
    expect(info).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.warn('Formatted message');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));

    console.error('Formatted message');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Formatted message'));
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