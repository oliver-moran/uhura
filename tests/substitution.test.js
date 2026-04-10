import { console, native, LogLevel, LogLabel } from '../dist/uhura.min.js';
import { jest } from '@jest/globals';

describe('Substitutions', () => {
  let log;

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

  test('Substution strings are replaced correctly', () => {
    console.log('This is a log %s %i %f %o.', 'message', 10.2, 100, { test: 'str',  test2: [1, 2, 3] });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('This is a log message 10 100.000000 {\"test\":\"str\",\"test2\":[1,2,3]}'));
  });

  test('Remaining arguments are logged correctly', () => {
    console.log('This is a log %s.', 'message', 10.2, 100);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('This is a log message.'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('10.2'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('100'));
  });

});