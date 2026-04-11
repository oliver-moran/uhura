![Uhura, "Hailing frequencies open, sir."](https://github.com/oliver-moran/uhura/blob/main/assets/uhura-256.webp)

`uhura` is a drop-in replacement for the native `console` in JavaScript and
TypeScript projects.

It enhances the native `console` with improved formatting and a callback
function, especially useful in terminal environments.

Standard console methods not implemented by `uhura` fall back to the native
console, which is always available.

## Basic usage

Install `uhura` via npm:

```bash
npm i @oliver.moran/uhura
```

```javascript
import { console } from "@oliver.moran/uhura";

console.log("Hailing frequencies open, sir.");
// [ LOG ] 2026-04-01T12:00:00.000Z
// (string) Hailing frequencies open, sir.
```

Objects passed to the console will be expanded:

```javascript
const object = {
    Stardate: 1312.4,
    Kelso: "Object is now within tractor beam range.",
}

console.log(object);
// [ LOG ] 2026-04-01T12:00:00.000Z
// (object) {
//   "Stardate": 1312.4,
//   "Kelso": "Object is now within tractor beam range."
// }
```

## Log levels

`uhura` uses a hierarchy of logging levels:

- `LogLevel.LOG` (logs everything)
- `LogLevel.DEBUG`
- `LogLevel.INFO`
- `LogLevel.WARN`
- `LogLevel.ERROR`
- `LogLevel.NONE` (disables all logging)

Additionally, there are a special logging levels, `LogLevel.TIME` and
`LogLevel.COUNT`, that operate independently of this hierarchy.

Note: The methods `console.table` and `console.trace` are logged at the levels
of `LogLevel.LOG` and `LogLevel.DEBUG`, respectively.

```javascript
import { console, native, LogLevel } from "@oliver.moran/uhura";

console({ level: LogLevel.WARN });

// Won't be displayed:

console.log("Stardate -296752.0547945205.");

// Will be displayed:

console.warn("Klingons on the starboard bow.")
// [ WARN ] 2026-04-09T07:58:42.640Z
// (string) Klingons on the starboard bow.

console.error("Warp core breach.");
// [ ERROR ] 2026-04-01T12:00:00.000Z
// (string) Warp core breach.

// Will always be displayed (using native console):

native.info("The Prime Directive is not just a set of rules.");
// The Prime Directive is not just a set of rules.
```

Timers and counters can also be enabled or disabled:

```javascript
console({ count: false, time: false })

// Won't be displayed:

console.time("Warp engines online");
console.timeEnd("Warp engines online");

console.count("...to beam up.");
console.countReset("...to beam up.");
```

And stack tracing of `Error` objects and for `console.trace`:

```javascript
console({ trace: false });

try {
    throw new Error("KHAAANNN!")
} catch (err) {
    console.warn(err);
    // [ WARN ] 2026-04-01T12:00:00.000Z
    // (error) KHAAANNN!
}
```

Note: Stack traces will always be sent to the `callback` function, where they
can be handled manually.

## Callback function

You can define a custom callback function that is executed after every console
event:

```javascript
import { console, native, LogLevel, LogLabel } from "@oliver.moran/uhura";

function callback(level, args) {
    // Careful: Use the native console in the callback function. Otherwise,
    // you may cause an infinite loop of callbacks.

    if (level >= LogLevel.WARN) {
        // Add code to save logs to a file or database here.

        const label = LogLabel[level];
        native.log(label, ...args);
        // WARN I'm a doctor, not a mechanic.
    }

    if (level === LogLevel.COUNT) {
        const [label, count] = args;
        native.log(label, count)
        // Klingons 1
    }

    if (level === LogLevel.TIME) {
        const [label, ms, ...logs] = args;

        native.log(...logs);
        native.log(`${label}: I cannot change the laws of physics, Captain! A've got to have ${ms}ms.`);
        // Beam us up, fast.
        // Scotty: I cannot change the laws of physics, Captain! A've got to have 0ms.
    }
};

console({ callback: callback });

console.warn("I'm a doctor, not a mechanic.");
// [ WARN ] 2026-04-01T12:00:00.000Z
// (string) I'm a doctor, not a mechanic.

console.count("Klingons");
// [ COUNT ] 1 Klingons 2026-04-01T12:00:00.000Z

console.time("Scotty");
console.timeLog("Scotty", "Beam us up, fast.");
// [ TIME ] 0.000s Scotty 2026-04-01T12:00:00.000Z
// [ LOG ] 2026-04-01T12:00:00.000Z
// (string) Beam us up, fast.
```

Note: When a `callback` method is set, it will always be invoked, regardless of
the general logging settings.

## Error handling

`uhura` takes the approach of robust error checking while failing silently in
case of an error:

- Invalid settings are ignored when calling `console`.
- If an object cannot be serialised then it is cast as a String (`[object
Object]`).
- Uncaught exceptions in callback functions are caught and logged using the
native console's error method.
- If `console.table` is called with improper arguments, `uhura` will attempt to
correct them automatically.
- Calling `console.time` with an already existing label will do nothing.
- Calling `console.timeLog` or `console.timeEnd` with a non-existent label will
do nothing.
- Calling `console.countReset` with a non-existent label will do nothing.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file
for details.