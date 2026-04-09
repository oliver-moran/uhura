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
 * severe and None being the most severe (no logging). You can adjust the
 * logLevel and saveLevel in the Settings object to control which messages are
 * logged and saved. For example, setting logLevel to LogLevel.WARN will only
 * log warnings and errors, while setting saveLevel to LogLevel.INFO will save
 * informational messages, warnings, and errors.
 */
export enum LogLevel {
    LOG     = 0,
    DEBUG   = 1,
    INFO    = 2,
    WARN    = 3,
    ERROR   = 4,
    NONE    = 5, // No logging
    TIMER   = "TIMER", // Special level for timers
}

const LEVELS_LABELS = ["LOG", "DEBUG", "INFO", "WARN", "ERROR", "OFF"] as const;

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
 *   time: true,
 *   callback: (level, args) => {
 *     // Save logs to a database or external service here
 *   }
 * });
 */
export type UhuraSettings = {
    level?: LogLevel; // Minimum log level to log (default: LogLevel.LOG)
    time?: boolean; // Enable or disable timer logging (default: true)
    trace?: boolean; // Enable or disable stack traces for errors (default: true)
    callback?: (level: LogLevel, args: unknown[]) => void; // Callback function for saving logs (default: no-op)
};

const config: UhuraSettings = {
    level: LogLevel.LOG,
    time: true,
    trace: true,
    callback: (level: LogLevel, args: unknown[]) => {
        // Implement your custom logic here
    }
};

let timers = new Map<string, number>();

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
 * @returns The custom console object for chaining.
 * @example
 */
export function console(settings: UhuraSettings): Function {
    if (settings.level !== undefined && typeof settings.level === "number")
        config.level = settings.level;
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
 * Starts a timer with the given label.
 * If TIMERS is false, this will not log anything.
 * @param label The label for the timer.
 * @returns void
 */
console.time = (label: string): void => {
    const timer = timers.get(label);
    if (!timer) timers.set(label, Date.now());
};

/**
 * Logs the current value of the timer with the given label.
 * If TIMERS is false, this will not log anything.
 * @param label The label for the timer.
 * @param args Additional arguments to log.
 * @return void
 */
console.timeLog = (label: string, ...args: unknown[]): void => {
    outputTimer(label, args);
};

/**
 * Ends a timer with the given label.
 * If TIMERS is false, this will not log anything.
 * @param label The label for the timer.
 * @returns void
 */
console.timeEnd = (label: string): void => {
    outputTimer(label);
    timers.delete(label);
};

// List the other console methods here that are not implemented in uhura, and
// default them to the native console implementation.
console.assert = (condition: boolean, ...args: unknown[]) => native?.assert(condition, ...args);
console.clear = () => native?.clear();
console.count = (label?: string) => native?.count(label);
console.countReset = (label?: string) => native?.countReset(label);
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
        const label = ` ${LEVELS_LABELS[level as number]} `;

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