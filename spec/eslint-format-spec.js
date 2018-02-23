/** @babel */

import eslintFormat from "../lib/eslint-format";
import {Range} from "atom";
import {fixturesPath, mockConfig} from "./helper";

describe("eslint-format", function () {
	beforeEach(async function () {
		await atom.packages.activatePackage("eslint-format");
		mockConfig();
	});

	describe("grammars", function () {
		it("should return grammars from settings", function () {
			const scopes = atom.config.get("eslint-format.scopes");
			const {grammars} = eslintFormat.provideRangeCodeFormat();

			expect(scopes).toEqual(grammars);
		});
		it("should return grammars from settings", function () {
			const scopes = ["test", "scopes"];
			atom.config.set("eslint-format.scopes", scopes);
			const {grammars} = eslintFormat.provideRangeCodeFormat();

			expect(scopes).toEqual(grammars);
		});
	});

	describe("formatCode", function () {
		it("should create a new worker and remove it when done", async function () {
			const testFile = fixturesPath("test.js");
			const editor = await atom.workspace.open(testFile);
			const promise = eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(eslintFormat.workers.size).toBe(1);
			await promise;
			expect(eslintFormat.workers.size).toBe(0);
		});

		it("should return an array of textEdit objects", async function () {
			const testFile = fixturesPath("test.js");
			const editor = await atom.workspace.open(testFile);
			const textEdits = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(textEdits).toEqual([{
				newText: ";",
				oldText: "",
				oldRange: new Range([0, 6], [0, 6]),
			}]);
		});

		it("should list errors in reverse order", async function () {
			const lotsOfErrorsFile = fixturesPath("lots-of-errors.js");
			const editor = await atom.workspace.open(lotsOfErrorsFile);
			const textEdits = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(textEdits.length).toBe(13);
			expect(textEdits[0].oldRange.start.row).toBeGreaterThan(textEdits[7].oldRange.start.row);
		});

		it("should only fix errors if errorsOnly is true", async function () {
			const lotsOfErrorsFile = fixturesPath("lots-of-errors.js");
			const editor = await atom.workspace.open(lotsOfErrorsFile);
			atom.config.set("eslint-format.errorsOnly", true);
			const textEdits = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(textEdits.length).toBe(8);
		});

		it("should return an empty array if no fixable errors are found", async function () {
			const noFixableErrorsFile = fixturesPath("no-fixable-errors.js");
			const editor = await atom.workspace.open(noFixableErrorsFile);
			const textEdits = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(textEdits).toEqual([]);
		});

		it("should throw an error if not valid js", async function () {
			const notValidJsFile = fixturesPath("not-valid-js.js");
			const editor = await atom.workspace.open(notValidJsFile);
			let error;
			try {
				await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);
			} catch (ex) {
				error = ex;
			}

			expect(error).toEqual(jasmine.any(Error));
		});

		it("should return correct ranges for selected fix", async function () {
			const lotsOfErrorsFile = fixturesPath("lots-of-errors.js");
			const editor = await atom.workspace.open(lotsOfErrorsFile);
			const range = new Range([6, 0], [9, 0]);
			const textEdits = await eslintFormat.provideRangeCodeFormat().formatCode(editor, range);

			expect(textEdits).toEqual([{
				newText: "const",
				oldText: "let",
				oldRange: new Range([7, 1], [7, 4]),
			}]);
		});
	});
});
