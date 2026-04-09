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
import { console } from "uhura";

console.log("Damn it, Jim, I'm a doctor, not a programmer.");
// [ LOG ] 2026-04-01T12:00:00.000Z
// (string) Damn it, Jim, I'm a doctor, not a programmer.
```

Objects passed to the console will be expanded:

```javascript
const quote = {
    Stardate: 1312.4,
    Kelso: "Object is now within tractor beam range.",
}

console.log(quote);
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

Additionally, there is a special logging level, `LogLevel.TIMER`, which operates
independently of this hierarchy.

```javascript
import { console, native, LogLevel } from "uhura";

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

Timers can also be enabled or disabled:

```javascript
console({ time: false })

// Won't be displayed:

console.time("Warp engines online");
console.timeEnd("Warp engines online");
```

And so can stack tracing on errors:

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

## Callback function

You can define a custom callback function that is executed after every console
event:

```javascript
function callback(level, args) {
    // Careful: Use the native console in the callback function. Otherwise,
    // you may cause an infinite loop of callbacks.

    if (level >= LogLevel.WARN) {
        /* Add code to save logs to a file or database here. */
    }

    if (level === LogLevel.TIMER) {
        const [label, ms, ...logs] = args;

        native.log(...logs);
        native.log(`${label}: I cannot change the laws of physics, Captain! A've got to have ${ms + 10}ms.`);
        // Beam us up, fast.
        // Scotty: I cannot change the laws of physics, Captain! A've got to have 10ms.
    }
};

console({ time: true, callback: callback });

console.time("Scotty");
console.timeLog("Scotty", "Beam us up, fast.");
// [ TIMER ] 0ms Scotty
// [ LOG ] 2026-04-01T12:00:00.000Z
// (string) Beam us up, fast.
```

## Error handling

`uhura` takes the approach of robust error checking while failing silently in
case of an error:

- Invalid settings are ignored when calling `console`.
- Calling `console.time` with an already existing label will do nothing.
- Calling `console.timeLog` or `console.timeEnd` with a non-existent label will do nothing.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file
for details.