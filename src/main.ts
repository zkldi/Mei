import winston, { format, transports, Logger, LeveledLogMethod } from "winston";

export type MeiLogger = Logger & { severe: LeveledLogMethod };
export type MeiLogLevels = "crit" | "severe" | "error" | "warn" | "info" | "verbose" | "debug";

const IN_TESTING = process.env.NODE_ENV === "test";

const formatExcessProperties = (meta: Record<string, unknown>) => {
	let i = 0;
	for (const key in meta) {
		const val = meta[key];

		if (val instanceof Error) {
			meta[key] = { message: val.message, stack: val.stack };
		}
		i++;
	}

	if (!i) {
		return "";
	}

	return ` ${JSON.stringify(meta)}`;
};

const formatExcessPropertiesNoStack = (meta: Record<string, unknown>, omitKeys: string[] = []) => {
	let i = 0;
	const realMeta: Record<string, unknown> = {};

	for (const key in meta) {
		if (omitKeys.includes(key)) {
			continue;
		}

		const val = meta[key];

		if (val instanceof Error) {
			realMeta[key] = { message: val.message };
		} else {
			realMeta[key] = val;
		}
		i++;
	}

	if (!i) {
		return "";
	}

	return ` ${JSON.stringify(realMeta)}`;
};

winston.addColors({
	crit: ["bgRed", "black"],
	severe: ["bgWhite", "red"],
	error: ["red"],
	warn: ["yellow"],
	info: ["blue"],
	verbose: ["cyan"],
	debug: ["white"],
});

const baseFormatRoute = format.combine(
	format.timestamp({
		format: "YYYY-MM-DD HH:mm:ss",
	})
);

const LOG_LEVELS = ["crit", "severe", "error", "warn", "info", "verbose", "debug"];

export function CreateLogger(
	projectName: string,
	overrideLevel?: MeiLogLevels,
	overrideTransports?: winston.transport[]
) {
	let logLevel = "info";

	if (overrideLevel) {
		logLevel = overrideLevel;
	} else if (process.env.LOG_LEVEL) {
		if (!LOG_LEVELS.includes(process.env.LOG_LEVEL)) {
			throw new Error(
				`Invalid process.env.LOG_LEVEL ${
					process.env.LOG_LEVEL
				}, expected any of ${LOG_LEVELS.join(", ")}`
			);
		}
	}

	const meiPrintf = format.printf(
		({ level, message, context = projectName, timestamp, ...meta }) =>
			`${timestamp} [${
				Array.isArray(context) ? context.join(" | ") : context
			}] ${level}: ${message}${formatExcessProperties(meta)}`
	);

	const meiConsolePrintf = format.printf(
		({ level, message, context = projectName, timestamp, hideFromConsole, ...meta }) =>
			`${timestamp} [${
				Array.isArray(context) ? context.join(" | ") : context
			}] ${level}: ${message}${formatExcessPropertiesNoStack(meta, hideFromConsole)}`
	);

	const defaultFormatRoute = format.combine(
		baseFormatRoute,
		format.errors({ stack: false }),
		meiPrintf
	);

	const consoleFormatRoute = format.combine(
		baseFormatRoute,
		format.errors({ stack: false }),
		meiConsolePrintf,
		format.colorize({
			all: true,
		})
	);

	let tports;

	if (overrideTransports) {
		tports = overrideTransports;
	} else if (IN_TESTING) {
		tports = [
			new transports.File({
				filename: `logs/${projectName}-tests-error.log`,
				level: "error",
				format: defaultFormatRoute,
			}),
			new transports.File({
				filename: `logs/${projectName}-tests.log`,
				format: defaultFormatRoute,
			}),
			new transports.Console({
				format: consoleFormatRoute,
			}),
		];
		/* istanbul ignore next */
	} else {
		tports = [
			new transports.File({
				filename: "logs/mei-error.log",
				level: "error",
				format: defaultFormatRoute,
			}),
			new transports.File({ filename: "logs/mei.log", format: defaultFormatRoute }),
			new transports.Console({
				format: consoleFormatRoute,
			}),
		];
	}

	const logger = winston.createLogger({
		levels: {
			crit: 0, // entire process termination is necessary
			severe: 1, // something is wrong, and more than one function is affected (such as a failed assertion that is definitely expected to be true).
			error: 2, // function call (or related process) has failed unexpectedly
			warn: 3, // function call has hit something it didn't want, but can recover
			info: 4, // something has happened that is expected, but worth logging
			verbose: 5, // something has happened
			debug: 6, // glorified console.log debugging
		},
		level: logLevel,
		format: defaultFormatRoute,
		transports: tports,
	});

	return logger as MeiLogger;
}
