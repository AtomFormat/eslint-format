/** @babel */

import worker from "../lib/worker";
import {fixturesPath, projectPath} from "./helper";
import eslint from "eslint";

describe("worker", () => {
	describe("worker", () => {
		beforeEach(() => {
			spyOn(worker, "execute").and.callThrough();
		});

		it("should run once if config is found", async () => {
			const fileDir = fixturesPath();
			const text = "\"test\";";
			const config = {
				defaultConfig: "/test/",
				errorsOnly: false,
			};
			await worker(fileDir, projectPath(fileDir), text, config);

			expect(worker.execute.calls.mostRecent().args[2].cwd).not.toBe(config.defaultConfig);
		});

		it("should run with default config if no config is found", async () => {
			const file = "/";
			const text = "\"test\";";
			const config = {
				defaultConfig: fixturesPath(),
				errorsOnly: false,
			};
			await worker(null, projectPath(file), text, config);

			expect(worker.execute.calls.mostRecent().args[2].cwd).toBe(config.defaultConfig);
		});

		it("should run default config if no editor path and no project path", async () => {
			atom.project.setPaths([]);
			const fileDir = null;
			const text = "\"test\";";
			const config = {
				defaultConfig: fixturesPath(),
				errorsOnly: false,
			};
			await worker(fileDir, projectPath(fileDir), text, config);

			expect(worker.execute.calls.mostRecent().args[2].cwd).toBe(config.defaultConfig);
		});
	});
	describe("getDefaultConfig", () => {
		it("should return the default config when given a folder", async () => {
			const config = fixturesPath();
			const defaultConfig = await worker.getDefaultConfig(config);

			expect(defaultConfig).toEqual(config);
		});

		it("should return the default config folder when given a json file", async () => {
			const config = fixturesPath(".eslintrc.json");
			const dirname = fixturesPath();
			const defaultConfig = await worker.getDefaultConfig(config);

			expect(defaultConfig).toEqual(dirname);
		});
	});

	describe("execute", () => {
		it("should send fixes", async () => {
			const text = "\"test\"";
			const config = {
				useEslintrc: false,
				rules: {
					semi: 1,
				},
			};
			const result = await worker.execute(eslint, text, config);

			expect(result[0].messages[0].fix.text).toBe(";");
		});

		it("should throw error if no config", async () => {
			const text = "test";
			const config = {
				cwd: "/"
			};
			let error;
			try {
				await worker.execute(eslint, text, config);
			} catch (e) {
				error = e;
			}
			expect(error).toEqual(jasmine.any(Error));
			expect(error.message).toEqual(jasmine.stringMatching(/^No ESLint configuration found/));
		});
	});

	describe("getEslint", () => {

		it("should use local eslint if found", async () => {
			const dir = fixturesPath("eslint");
			const workerEslint = await worker.getEslint(dir);
			expect(workerEslint.CLIEngine.version).not.toBe(eslint.CLIEngine.version);
		});

		it("should use global eslint if not found", async () => {
			const dir = fixturesPath();
			const workerEslint = await worker.getEslint(dir);
			expect(workerEslint.CLIEngine.version).toBe(eslint.CLIEngine.version);
		});
	});
});
