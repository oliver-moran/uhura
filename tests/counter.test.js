import { console, native, LogLevel } from '../dist/uhura.min.js';
import { expect, jest } from '@jest/globals';

describe('Counters', () => {

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

  test('When a counter is created, it counts correctly', () => {
    console({ count: true, level: LogLevel.LOG });
    console.count('testCounter');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLevel[LogLevel.COUNT]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('testCounter'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('1'));

    console.count('testCounter');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLevel[LogLevel.COUNT]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('testCounter'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('2'));

    console.countReset('testCounter');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLevel[LogLevel.COUNT]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('testCounter'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('0'));

    console.count('testCounter');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLevel[LogLevel.COUNT]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('testCounter'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('1'));
  });

  test('When a counter does not exist, reset does nothing', () => {
    console.countReset('newCounter');
    expect(log).not.toHaveBeenCalled();
  });

  test('When counters are disabled, they don\'t run', () => {
    console({ count: false, level: LogLevel.LOG });
    console.count('testCounter');
    expect(log).not.toHaveBeenCalled();

    console.countReset('testCounter');
    expect(log).not.toHaveBeenCalled();
  });

});