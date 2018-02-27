/** @babel */

import eslintFormat from "../lib/eslint-format";
import {Range} from "atom";
import {fixturesPath} from "./helper";

describe("eslint-format", function () {
	beforeEach(async function () {
		await atom.packages.activatePackage("eslint-format");
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

		it("should return the correct oldText", async function () {
			const lotsOfErrorsFile = fixturesPath("lots-of-errors.js");
			const editor = await atom.workspace.open(lotsOfErrorsFile);
			const [{oldText}] = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(oldText).toBe(`
function test (){
	let that =0;
this.one  = 1
		nums ( 2,3,  4);
}

function func2() {
	let a = 1;
}
`);
		});

		it("should fix errors and warnings", async function () {
			const lotsOfErrorsFile = fixturesPath("lots-of-errors.js");
			const editor = await atom.workspace.open(lotsOfErrorsFile);
			const [{newText}] = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(newText).toBe(`
function test() {
	const that = 0;
	this.one = 1;
	nums(2, 3, 4);
}

function func2() {
	const a = 1;
}
`);
		});

		it("should only fix errors if errorsOnly is true", async function () {
			const lotsOfErrorsFile = fixturesPath("lots-of-errors.js");
			const editor = await atom.workspace.open(lotsOfErrorsFile);
			atom.config.set("eslint-format.errorsOnly", true);
			const [{newText}] = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);
			const lines = newText.split("\n");

			expect(lines[3]).toBe("\tthis.one  = 1");
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
			const range = new Range([7, 0], [10, 0]);
			const [{oldRange}] = await eslintFormat.provideRangeCodeFormat().formatCode(editor, range);

			expect(oldRange).toEqual(range);
		});

		it("should run fix mulltiple times to get every rule", async function () {
			const doubleRunFile = fixturesPath("double-run.js");
			const editor = await atom.workspace.open(doubleRunFile);
			const [{newText}] = await eslintFormat.provideOnSaveCodeFormat().formatCode(editor);

			expect(newText).toContain("${b}");
		});
	});
});
