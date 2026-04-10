import { console, native, LogLevel } from '../dist/uhura.min.js';
import { expect, jest } from '@jest/globals';

describe('Timers', () => {

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
    warn = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
    warn.mockRestore();
  });

  test('When a timer is created, it runs correctly', () => {
    console({ time: true, level: LogLevel.LOG });
    console.time('testTimer');
    expect(log).not.toHaveBeenCalled();

    console.timeLog('testTimer', 'Halfway there...');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLevel[LogLevel.TIMER]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('testTimer'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Halfway there...'));

    console.timeEnd('testTimer');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(LogLevel[LogLevel.TIMER]));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('testTimer'));
  });

  test('When a timer does not exist, it is not logged', () => {
    console.timeEnd('nonExistentTimer');
    expect(log).not.toHaveBeenCalled();
  });

  test('When timers are disabled, they don\'t run', () => {
    console({ time: false });

    console.time('myTimer2');
    expect(log).not.toHaveBeenCalled();

    console.timeLog('myTimer2', 'Halfway there...');
    expect(log).not.toHaveBeenCalled();

    console.timeEnd('myTimer2');
    expect(log).not.toHaveBeenCalled();
  });

});