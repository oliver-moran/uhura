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
    TIMER   = "TIMER", // Special level for timers
    COUNTER = "COUNTER" // Special level for counters
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
    "TIMER": "TIMER",
    "COUNTER": "COUNTER"
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
    callback?: (level: LogLevel, args: unknown[]) => void; // Callback function for saving logs (default: no-op)
};

const config: UhuraSettings = {
    level: LogLevel.LOG,
    count: true,
    time: true,
    trace: true,
    callback: (level: LogLevel, args: unknown[]) => {
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
export const native = globalThis.console;

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
 * Logs the number of times this count has been called with the given label.
 * If COUNTERS is false, this will not log anything.
 * @param [label="default"] The label for the counter.
 * @returns void 
 */
console.count = (label: string = DEFAULT): void => {
    if (typeof label !== "string") label = DEFAULT;
    const count = counters.get(label) || 0;
    counters.set(label, count + 1);
    outputCounter(label);
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
        outputCounter(label);
    }
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

    outputTimer(label, args);
};

/**
 * Ends a timer with the given label.
 * If TIMERS is false, this will not log anything.
 * @param [label="default"] The label for the timer.
 * @returns void
 */
console.timeEnd = (label: string = DEFAULT): void => {
    if (typeof label !== "string") label = DEFAULT;
    outputTimer(label);
    timers.delete(label);
};

// List the other console methods here that are not implemented in uhura, and
// default them to the native console implementation.
console.assert = (condition: boolean, ...args: unknown[]) => native?.assert(condition, ...args);
console.clear = () => native?.clear();
console.dir = (item: unknown, options?: Record<string, unknown>) => native?.dir(item, options);
console.dirxml = (item: unknown) => native?.dirxml(item);
console.group = (...args: unknown[]) => native?.group(...args);
console.groupCollapsed = (...args: unknown[]) => native?.groupCollapsed(...args);
console.groupEnd = () => native?.groupEnd();
console.table = (...args: unknown[]) => native?.table(...args);
console.trace = (...args: unknown[]) => native?.trace(...args);

Object.freeze(console); // Prevent modification of custom console

/**
 * Handles logging messages based on their level.
 * @param level The log level.
 * @param args The arguments to log.
 */
function handle(level: LogLevel, ...args: unknown[]):void {
    if (level >= config.level!) {
        const str = format(args, level);
        switch (level) {
            case LogLevel.LOG:
                native.log(str);
                break;
            case LogLevel.DEBUG:
                native.debug(str);
                break;
            case LogLevel.INFO:
                native.info(str);
                break;
            case LogLevel.WARN:
                native.warn(str);
                break;
            case LogLevel.ERROR:
                native.error(str);
                break;
            default:
                // Do nothing for LogLevel.NONE
                break;
        }
    }

    try { config.callback!(level, args); }
    catch (error) { native.error(error); }
}

/**
 * Formats objects for logging using JSON.stringify.
 * @param args An array of arguments to format.
 * @param level The log level.
 * @returns Formatted string.
 */
function format(args: unknown[], level:LogLevel = LogLevel.LOG): string {
    const date = new Date().toISOString();
    const strs = prepareOutput(args);

    return `${label(level)} ${colors.gray(date)}\n${strs.join("\n")}`;

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

function outputCounter(label: string): void {
    const count = counters.get(label) || 0;
    if (config.count && config.level !== LogLevel.NONE) {
        native.log(`${colors.bgMagenta(colors.whiteBright(` COUNT `))} ${colors.magenta(String(count))} ${colors.gray(label)}`);
    }

    try { config.callback!(LogLevel.COUNTER, [label, count]); }
    catch (error) { native.error(error); }
}

function outputTimer(label: string, logs: any[] = []): void {
    const start = timers.get(label);
    if (start !== undefined) {
        const duration = Date.now() - start;

        const days = Math.floor(duration / (24 * 60 * 60 * 1000));
        const hours = Math.floor((duration % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((duration % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((duration % (60 * 1000)) / 1000);
        const milliseconds = duration % 1000;

        const str = `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds > 0 ? `${seconds}s ` : ""}${milliseconds}ms`;
        if (config.time && config.level !== LogLevel.NONE) {
            native.log(`${colors.bgGreen(colors.whiteBright(` TIMER `))} ${colors.green(str)} ${colors.gray(label)}`);
            (logs || []).forEach(log => {
                const str = format(logs, LogLevel.LOG);
                native.log(str)
            });
        }

        try { config.callback!(LogLevel.TIMER, [label, duration].concat(logs)); }
        catch (error) { native.error(error); }
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

function serialize(obj: any): string {
    try {
        const json = JSON.stringify(obj, (key, value) => {
            if (["string", "number", "boolean"].includes(typeof value) || value === null) return value;
            // Objects
            else if (String(value) === "[object Object]") return value;
            // Arrays
            else if (Array.isArray(value)) return value;
            // Anything else (e.g. functions, symbols, BigInts)
            else return String(value);
        }, 2);
        
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