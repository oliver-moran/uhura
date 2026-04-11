/**
 * @projectname uhura
 * @author Oliver Moran <oliver.moran@gmail.com>
 * @license
 * Copyright 2026 Oliver Moran <oliver.moran@gmail.com>
 * This source code is licensed under the MIT license found in the
 * LICENSE file at https://github.com/oliver-moran/uhura
 */

import colors from 'yoctocolors';

/**
 * Log levels for controlling the verbosity of logging and saving.
 * The levels are ordered from least to most severe, with Log being the least
 * severe and None being the most severe (no logging).
 * 
 * You can adjust the logLevel and saveLevel in the Settings object to control
 * which messages are logged and saved. For example, setting logLevel to
 * LogLevel.WARN will only log warnings and errors, while setting saveLevel to
 * LogLevel.INFO will save informational messages, warnings, and errors.
 * 
 * The TIMER and COUNTER levels are special levels used for timer and counter
 * logs, which can be enabled or disabled separately from the main log levels.
 */
export enum LogLevel {
    LOG     = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARN    = 3,
    ERROR   = 4,
    NONE    = 5, // No logging
    TIME    = "TIME", // Special level for timers
    COUNT   = "COUNT" // Special level for counters
}

/**
 * Labels for log levels, used for formatting log messages. These labels are
 * used in the output of log messages to indicate their level (e.g., "LOG",
 * "DEBUG", "INFO", etc.). The labels are color-coded for better visibility in
 * the console. You can customize these labels and their colors as needed.
 */
export const LogLabel = {
    0: "LOG",
    1: "DEBUG",
    2: "INFO",
    3: "WARN",
    4: "ERROR",
    5: "OFF",
    "TIME": "TIME",
    "COUNT": "COUNT",
};

/**
 * Settings for configuring the behavior of the custom console. You can set the
 * log level, enable or disable timer logging, and provide a callback function
 * for saving logs to a database or other storage.
 * 
 * The callback function will be called with the log level and the arguments
 * that were logged, allowing you to implement custom logic for handling logs
 * (e.g., saving to a database, sending to an external logging service, etc.).
 * @example
 * console({
 *   level: LogLevel.INFO,
 *   time: false,
 *   count: false,
 *   callback: (level, args) => {
 *     // Custom logic to save logs to a database or external service
 *   }
 * });
 */
export type UhuraSettings = {
    level?: LogLevel; // Minimum log level to log (default: LogLevel.LOG)
    count?: boolean; // Enable or disable count logging (default: true)
    time?: boolean; // Enable or disable timer logging (default: true)
    trace?: boolean; // Enable or disable stack traces for errors (default: true)
    callback?: (level: LogLevel, args: Iterable<unknown>) => void; // Callback function for saving logs (default: no-op)
};

const config: UhuraSettings = {
    level: LogLevel.LOG,
    count: true,
    time: true,
    trace: true,
    callback: (level: LogLevel, args: Iterable<unknown>) => {
        // Implement your custom logic here
    }
};

const DEFAULT = "default";
const timers = new Map<string, number>();
const counters = new Map<string, number>();

/**
 * Native console object for access to default behavior and methods.
 * @example
 * native.log("This will use the native console.log, bypassing the uhura.");
 */
export const native = globalThis?.console;

/**
 * Custom console object that overrides the default console methods to include
 * log levels, formatting, and saving to a database. It also includes custom
 * implementations for time, timeLog, and timeEnd methods. All other console
 * methods default to the native console implementation.
 * @param settings The settings to configure the behavior of the custom console.
 * - level: The minimum log level to log (default: LogLevel.LOG).
 * - count: Enable or disable count logging (default: true).
 * - time: Enable or disable timer logging (default: true).
 * - trace: Enable or disable stack traces for errors (default: true).
 * - callback: A callback function that will be called with the log level and
 *   arguments whenever a log method is called, allowing you to implement custom
 *   logic for saving logs to a database or external service (default: no-op).
 * @returns The custom console object for chaining.
 * @example
 * console({ level: LogLevel.INFO });
 * console.log("This message is below the INFO level and won't be displayed.");
 */
export function console(settings: UhuraSettings): Function {
    if (settings.level !== undefined && typeof settings.level === "number")
        config.level = settings.level;
    if (settings.count !== undefined && typeof settings.count === "boolean")
        config.count = settings.count;
    if (settings.time !== undefined && typeof settings.time === "boolean")
        config.time = settings.time;
    if (settings.trace !== undefined && typeof settings.trace === "boolean")
        config.trace = settings.trace;
    if (settings.callback !== undefined && typeof settings.callback === "function")
        config.callback = settings.callback;

    return console; // Return the custom console object for chaining
}

/**
 * Logs a message to the console and saves it to the database.
 * Accepts the same overloading as the default console.log.
 * @param args The arguments to log.
 * @return void
 */
console.log = (...args: unknown[]): void => handle(LogLevel.LOG, ...args);

/**
 * Logs an informational message to the console and saves it to the database.
 * Accepts the same overloading as the default console.debug.
 * @param args The arguments to log.
 * @return void
 */
console.debug = (...args: unknown[]): void => handle(LogLevel.DEBUG, ...args);

/**
 * Logs an informational message to the console and saves it to the database.
 * Accepts the same overloading as the default console.info.
 * @param args The arguments to log.
 * @return void
 */
console.info = (...args: unknown[]): void => handle(LogLevel.INFO, ...args);

/**
 * Logs a warning to the console and saves it to the database.
 * Accepts the same overloading as the default console.warn.
 * @param args The arguments to log.
 * @return void
 */
console.warn = (...args: unknown[]): void => handle(LogLevel.WARN, ...args);

/**
 * Logs an error to the console and saves it to the database.
 * Accepts the same overloading as the default console.error.
 * @param args The arguments to log.
 * @returns void
 */
console.error = (...args: unknown[]): void => handle(LogLevel.ERROR, ...args);

/**
 * Logs an assertion failure as an error to the console. Accepts the same
 * overloading as the default console.assert.
 * @param condition The condition to test.
 * @param args The arguments to log if the assertion fails.
 */
console.assert = (condition: boolean, ...args: unknown[]): void => {
    if (!condition) console.error(...args);
}

/**
 * Logs the number of times this count has been called with the given label.
 * If COUNTERS is false, this will not log anything.
 * @param [label="default"] The label for the counter.
 * @returns void 
 */
console.count = (label: string = DEFAULT): void => {
    if (typeof label !== "string") label = DEFAULT;
    const count = counters.get(label) || 0;
    counters.set(label, count + 1);
    counter(label);
};

/**
 * Resets the count for the given label to zero.
 * If COUNTERS is false, this will not log anything.
 * @param [label="default"] The label for the counter.
 * @returns void
 */
console.countReset = (label: string = DEFAULT): void => {
    if (typeof label !== "string") label = DEFAULT;
    const exists = !!counters.get(label);
    if (exists) {
        counters.delete(label);
        counter(label);
    }
};

/**
 * Logs a table to the console. If the log level is higher than LOG, this will
 * not log anything.
 * @param data The data to log as a table.
 * @param columns The columns to include in the table.
 */
console.table = (data: Iterable<unknown> = [], columns?: string[] | number[]): void => {
    // Ensure data is an array or object
    if (typeof data === "undefined") data = [];
    else if (typeof data !== "object") data = [data];

    // Ensure columns are strings
    if (Array.isArray(columns)) {
        columns = columns.map(col => String(col));
    } else if (typeof columns !== "undefined") columns = [String(columns)];

    if (config.level! as number <= LogLevel.LOG) {
        const str = format(LogLevel.LOG);
        native?.log(str);
        // FIXME: We currently lean on the native console.table for formatting,
        // but blend with the custom formatting and log level control of uhura.
        native?.table(data, columns as string[]);
    }

    // The native console.table doesn't allow us to capture the formatted
    // table as an argument, so we'll just pass the original arguments to
    // the callback, filtering the data based on the columns if necessary.

    if (columns) {
        // Filter the data based on the specified columns.
        const filtered:Map<string, any> = new Map();

        for (const key in data as Record<string, any>) {
            const item: Record<string, unknown> = {};
            try {
                for (const column of columns) {
                    if (column in (data as Record<string, any>)[key]) {
                        item[column] = ((data as Record<string, any>)[key] as Record<string, unknown>)[column];
                    }
                }
            } catch (error) {
                // Ignore errors when accessing properties
            }
            filtered.set(key, item);
        }

        callback(LogLevel.LOG, filtered);
    } else {
        // If no columns are specified, pass the original data as an
        // argument to the callback.
        callback(LogLevel.LOG, new Map(Object.entries(data)));
    }
};

/**
 * Logs a stack trace to the console. If the log level is higher than DEBUG,
 * this will not log anything.
 * @param args The arguments to log.
 */
console.trace = (...args: unknown[]): void => {
    const date = new Date().toISOString();
    const label = `${colors.bgBlue(colors.whiteBright(` ${LogLabel[LogLevel.DEBUG]} `))} ${colors.gray(date)}`;
    const output = prepareOutput(args);
    const stack = (new Error().stack || "").split('\n').splice(2).join('\n');
    const str = `${label}\n${output.length ? `${output.join("\n")}\n` : ""}${(config.trace) ? `${colors.gray(stack)}` : ""}`;

    if (config.level! as number <= LogLevel.DEBUG)
        native?.debug(str);
    callback(LogLevel.DEBUG, [stack, ...args]);
};

/**
 * Starts a timer with the given label.
 * If TIMERS is false, this will not log anything.
 * @param [label="default"] The label for the timer.
 * @returns void
 */
console.time = (label: string = DEFAULT): void => {
    if (typeof label !== "string") label = DEFAULT;
    const timer = timers.get(label);
    if (!timer) timers.set(label, Date.now());
};

/**
 * Logs the current value of the timer with the given label.
 * If TIMERS is false, this will not log anything.
 * @param [label="default"] The label for the timer.
 * @param args Additional arguments to log.
 * @return void
 */
console.timeLog = (label: string = DEFAULT, ...args: unknown[]): void => {
    if (typeof label !== "string") {
        args = [label, ...args]; // Shift "label" into args if it's not a string
        label = DEFAULT;
    }

    timer(label, args);
};

/**
 * Ends a timer with the given label.
 * If TIMERS is false, this will not log anything.
 * @param [label="default"] The label for the timer.
 * @returns void
 */
console.timeEnd = (label: string = DEFAULT): void => {
    if (typeof label !== "string") label = DEFAULT;
    timer(label);
    timers.delete(label);
};

// These methods don't require custom handling, so we can directly delegate to
// the native console.
console.clear = (): void => native?.clear();
console.group = (...args: unknown[]): void => native?.group(...args);
console.groupCollapsed = (...args: unknown[]): void => native?.groupCollapsed(...args);
console.groupEnd = (): void => native?.groupEnd();

// These methods will require custom handling but are not implemented yet, so
// we'll just delegate to the native console for now.
console.dir = (item: unknown, options?: Record<string, unknown>) => native?.dir(item, options);
console.dirxml = (item: unknown) => native?.dirxml(item);

Object.freeze(console); // Prevent modification of custom console

/**
 * Handles logging messages based on their level.
 * @param level The log level.
 * @param args The arguments to log.
 */
function handle(level: LogLevel, ...args: unknown[]):void {
    if (level >= config.level!) {
        const str = format(level, args);
        switch (level) {
            case LogLevel.LOG:
                native?.log(str);
                break;
            case LogLevel.DEBUG:
                native?.debug(str);
                break;
            case LogLevel.INFO:
                native?.info(str);
                break;
            case LogLevel.WARN:
                native?.warn(str);
                break;
            case LogLevel.ERROR:
                native?.error(str);
                break;
            default:
                // Do nothing for LogLevel.NONE
                break;
        }
    }

    callback(level, args);
}

function callback(level: LogLevel, args: Iterable<unknown>): void {
    try { config.callback!(level, args); }
    catch (error) { native?.error(error); }
}

/**
 * Formats objects for logging using JSON.stringify.
 * @param args An array of arguments to format.
 * @param level The log level.
 * @returns Formatted string.
 */
function format(level:LogLevel = LogLevel.LOG, args: unknown[] = []): string {
    const date = new Date().toISOString();
    
    if (typeof args[0] === "string")
        args = substitute(String(args[0]), args.slice(1));

    const strs = prepareOutput(args);

    return `${label(level)} ${colors.gray(date)}\n${strs.join("\n")}`.trim();

    function label(level: LogLevel): string {
        const label = ` ${LogLabel[level]} `;

        switch (level) {
            case LogLevel.ERROR:
                return `${colors.bgRed(colors.whiteBright(label))}`;
            case LogLevel.WARN:
                return `${colors.bgYellow(colors.black(label))}`;
            case LogLevel.INFO:
                return `${colors.bgCyan(colors.whiteBright(label))}`;
            case LogLevel.DEBUG:
                return `${colors.bgBlue(colors.whiteBright(label))}`;
            default:
                // No color for LogLevel.LOG or other unhandled levels
                return `${colors.bgGray(colors.whiteBright(label))}`;
        }
    }
}

function substitute(str: string, args: unknown[]): unknown[] {
    const specifiers = /%[oOdisf]/g;
    const remaining = [...args];

    const result = str.replace(specifiers, (specifier) => {
        if (remaining.length === 0) {
            return specifier; // No more arguments to substitute
        }

        const arg = remaining.shift();
        switch (specifier) {
            case '%o': // Substitute as an object ("optimally useful formatting")
                return serialize(arg, false);
            case '%O': // Substitute as an object ("generic JavaScript object formatting")
                return serialize(arg, true);
            case '%d':
            case '%i': // Substitute as an integer
                return typeof arg === 'number' ? Math.floor(arg).toString() : "NaN";
            case '%s': // Substitute as a string
                return String(arg);
            case '%f': // Substitute as a floating-point value
                return typeof arg === 'number' ? arg.toFixed(6).toString() : "NaN";
            default:
                return specifier; // Unknown specifier, return as is
        }
    });

    return [result, ...remaining];
}

function counter(label: string): void {
    const date = new Date().toISOString();
    const count = counters.get(label) || 0;
    if (config.count && config.level !== LogLevel.NONE) {
        native?.log(`${colors.bgMagenta(colors.whiteBright(` ${LogLabel[LogLevel.COUNT]} `))} ${colors.magenta(String(count))} ${colors.gray(label)} ${colors.gray(date)}`);
    }

    callback(LogLevel.COUNT, [label, count]);
}

function timer(label: string, logs: unknown[] = []): void {
    const date = new Date().toISOString();
    const start = timers.get(label);
    if (start !== undefined) {
        const duration = Date.now() - start;

        const days = Math.floor(duration / (24 * 60 * 60 * 1000));
        const hours = Math.floor((duration % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((duration % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = (duration % (60 * 1000)) / 1000;

        const str = `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds.toFixed(3)}s`;
        if (config.time && config.level !== LogLevel.NONE) {
            native?.log(`${colors.bgGreen(colors.whiteBright(` ${LogLabel[LogLevel.TIME]} `))} ${colors.green(str)} ${colors.gray(label)} ${colors.gray(date)}`);
            (logs || []).forEach(log => {
                const str = format(LogLevel.LOG, logs);
                native?.log(str)
            });
        }

        callback(LogLevel.TIME, [label, duration].concat(logs as []));
    }
}

function prepareOutput(input:unknown[]): string[] {
    return input.map((item, index) => {
        const type = (item instanceof Error) ? "error" : typeof item;
        const str = convertToString(item);
        return `${colors.gray(`(${type})`)} ${str}`;
    });
}

function convertToString(item: unknown): string {
    // Error objects with stack traces
    if (item instanceof Error) {
        const message = `${colors.redBright(item.message || String(item) || "Error")}`;
        const trace = item.stack && config.trace ? `\n${colors.gray(item.stack)}` : "";
        return `${message}${trace}`;
    }
    // JSON compatible objects (including arrays)
    else if (String(item) === "[object Object]" || Array.isArray(item)) return `${colors.blue(serialize(item))}`; // Handle objects (including arrays)
    // Primative values and all others
    else return colourize(item);
}

function colourize(value: unknown): string {
    if (typeof value === "string") return `${colors.cyan(String(value))}`; // Strings
    else if (typeof value === "number") return `${colors.yellow(String(value))}`; // Numbers
    else if (typeof value === "boolean") return `${colors.blueBright(String(value))}`; // Booleans
    else if (value === null || value === undefined) return `${colors.gray(String(value))}`; // Null/Undefined
    return `${colors.blue(String(value))}`; // Other types
}

function serialize(obj: any, format: boolean = true): string {
    try {
        const json = JSON.stringify(obj, (key, value) => {
            if (["string", "number", "boolean"].includes(typeof value) || value === null) return value;
            // Objects
            else if (String(value) === "[object Object]") return value;
            // Arrays
            else if (Array.isArray(value)) return value;
            // Anything else (e.g. functions, symbols, BigInts)
            else return String(value);
        }, format ? 2 : undefined); // Indent with 2 spaces for pretty formatting, or no spaces for single-line

        if (!format) return json; // Remove newlines for single-line output
        
        const colourised:string[] = [];
        for (let line of json.split("\n")) {
            // Colour keys
            line = line.replace(/"([^"]+)":/g, (_, key) => `${colors.magenta(`"${key}"`)}:`);
            
            // Colour string values
            line = line.replace(/(:|^\s*) "([^"]*)"/g, (_, colon, str) => `${colon} ${colors.cyan(`"${str}"`)}`);
            // Colour number values
            line = line.replace(/(:|^\s*) (-?\d+(\.\d+)?)/g, (_, colon, num) => `${colon} ${colors.yellow(num)}`);
            // Colour boolean values
            line = line.replace(/(:|^\s*) (true|false)/g, (_, colon, bool) => `${colon} ${colors.blueBright(bool)}`);
            // Colour null values
            line = line.replace(/(:|^\s*) null/g, (_, colon) => `${colon} ${colors.gray("null")}`);

            colourised.push(line);
        }

        return colourised.join("\n");
    } catch (error) {
        return String(obj);
    }
}

export default console;