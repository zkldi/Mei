# Mei
My prefered defaults for the Winston (Mei, get it?) Logger.

## About

[Winston](https://github.com/winstonjs/winston) is a great logging framework, and it's incredibly configurable.

I have a bunch of prefered defaults, and this repository is a quick wrapper around winston for that.

## API

Create a logger.ts/js file in your project that does the following:
```js
import { CreateLogger } from "mei-logger";

const logger = CreateLogger("my_project_name");

export default logger;
```

Then you can `import logger from "your_logger_file";` and use that in your project.

The second argument lets you pass a default log level. It's set to `"info"` by default.
If process.env.LOG_LEVEL is set, then that will be used. If a log level is passed to the function, that will take priority over the env var.

## Levels

I have 7 log levels:

```js
levels: {
	crit: 0, // entire process termination is necessary
	severe: 1, // something is wrong, and more than one function is affected (such as a failed assertion that is definitely expected to be true).
	error: 2, // function call (or related process) has failed unexpectedly
	warn: 3, // function call has hit something it didn't want, but can recover
	info: 4, // something has happened that is expected, but worth logging
	verbose: 5, // something has happened
	debug: 6, // glorified console.log debugging
},
```

## Everything Else

It's just a winston logger with some different types. See [their documentation](https://github.com/winstonjs/winston) for everything else.
