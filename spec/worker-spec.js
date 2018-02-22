/** @babel */

import worker from "../lib/worker";
import {fixturesPath, projectPath} from "./helper";
import eslint from "eslint";

describe("worker", function () {
	describe("worker", function () {
		beforeEach(function () {
			spyOn(worker, "execute").and.callThrough();
		});

		it("should run once if config is found", function () {
			const file = fixturesPath("test.js");
			const text = "\"test\";";
			const config = {
				defaultConfig: "/test/",
				errorsOnly: false,
			};
			worker(file, projectPath(file), text, config);

			expect(worker.execute.calls.mostRecent().args[2].cwd).not.toBe(config.defaultConfig);
		});

		it("should run with default config if no config is found", function () {
			const file = "/";
			const text = "\"test\";";
			const config = {
				defaultConfig: fixturesPath(),
				errorsOnly: false,
			};
			worker(file, projectPath(file), text, config);

			expect(worker.execute.calls.mostRecent().args[2].cwd).toBe(config.defaultConfig);
		});

		it("should run default config if no editor path and no project path", function () {
			atom.project.setPaths([]);
			const file = null;
			const text = "\"test\";";
			const config = {
				defaultConfig: fixturesPath(),
				errorsOnly: false,
			};
			worker(file, projectPath(file), text, config);

			expect(worker.execute.calls.mostRecent().args[2].cwd).toBe(config.defaultConfig);
		});

		it("should fix warnings when errorsOnly is false", function () {
			const file = fixturesPath("test.js");
			const text = "\"test\"";
			const config = {
				defaultConfig: "",
				errorsOnly: false,
			};
			const fixedText = worker(file, projectPath(file), text, config);

			expect(fixedText).toBe(`${text};\n`);
		});

		it("should not fix warnings when errorsOnly is true", function () {
			const file = fixturesPath("test.js");
			const text = "\"test\"";
			const config = {
				defaultConfig: "/",
				errorsOnly: true,
			};
			const fixedText = worker(file, projectPath(file), text, config);

			expect(fixedText).toBe(text);
		});
	});
	describe("getDefaultConfig", function () {
		it("should return the default config when given a folder", function () {
			const config = fixturesPath();
			const defaultConfig = worker.getDefaultConfig(config);

			expect(defaultConfig).toEqual(config);
		});

		it("should return the default config folder when given a json file", function () {
			const config = fixturesPath(".eslintrc.json");
			const dirname = fixturesPath();
			const defaultConfig = worker.getDefaultConfig(config);

			expect(defaultConfig).toEqual(dirname);
		});
	});

	describe("execute", function () {
		it("should fix the text", function () {
			const text = "\"test\"";
			const config = {
				fix: true,
				useEslintrc: false,
				rules: {
					semi: 1,
				},
			};
			const fixed = worker.execute(eslint, text, config);

			expect(fixed).toBe(`${text};`);
		});

		it("should not fix warnings", function () {
			const text = "\"test\"";
			const config = {
				fix: (rule => rule.severity === 2),
				useEslintrc: false,
				rules: {
					semi: 1,
				},
			};
			const fixed = worker.execute(eslint, text, config);

			expect(fixed).toBe(text);
		});

		it("should throw error if no config", function () {
			const text = "test";
			const config = {
				fix: true,
				cwd: "/"
			};
			expect(function () {
				worker.execute(eslint, text, config);
			}).toThrowError("No ESLint configuration found.");
		});
	});

	describe("getEslint", function () {

		it("should use local eslint if found", function () {
			const dir = fixturesPath("eslint");
			const workerEslint = worker.getEslint(dir);
			expect(workerEslint.CLIEngine.version).not.toBe(eslint.CLIEngine.version);
		});

		it("should use global eslint if not found", function () {
			const dir = fixturesPath();
			const workerEslint = worker.getEslint(dir);
			expect(workerEslint.CLIEngine.version).toBe(eslint.CLIEngine.version);
		});
	});
});
