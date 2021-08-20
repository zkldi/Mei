import t from "tap";
import { CreateLogger } from "./main";
import fs from "fs";
import rimraf from "rimraf";
import path from "path";

const logsDir = path.join(__dirname, "../logs");

t.before(() => {
	rimraf.sync(logsDir);
});

t.test("#CreateLogger", (t) => {
	t.test("Doesn't Die Horribly", (t) => {
		const logger = CreateLogger("project-name");

		logger.info(`Hello world!`);

		t.end();
	});

	t.test("Should respect override log levels", (t) => {
		const logger = CreateLogger("project-name", "error");

		logger.info(`This message should not appear.`);
		logger.error(`This message should appear!`);

		t.end();
	});

	t.test("Filesystem Log Checks", async (t) => {
		// initially, i wrote a script that would watch the logs directory and wait for
		// winston to populate it
		// it turns out that's really hard to do because the file is written to multiple times
		// and fs.watch is a bit unwieldy for unknown amount of writes (not their fault)

		// so, instead, check out this hack

		await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));

		const file = fs.readFileSync(path.join(logsDir, "project-name-tests.log"), "utf-8");

		const lines = file.split("\n").filter((e) => e !== "");

		t.match(lines[0], /\[project-name\] info: Hello world!$/u);
		t.match(lines[1], /\[project-name\] error: This message should appear!$/u);

		t.equal(lines.length, 2, "Should only have two lines.");

		t.end();
	});

	t.test("Filesystem Error Log Checks", async (t) => {
		// see above.

		await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));

		const file = fs.readFileSync(path.join(logsDir, "project-name-tests-error.log"), "utf-8");

		const lines = file.split("\n").filter((e) => e !== "");

		t.match(lines[0], /\[project-name\] error: This message should appear!$/u);

		t.equal(lines.length, 1, "Should only have one line.");
		t.end();
	});

	t.end();
});
