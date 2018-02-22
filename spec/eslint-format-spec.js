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
			const {grammars} = eslintFormat.provideCodeFormat();

			expect(scopes).toEqual(grammars);
		});
		it("should return grammars from settings", function () {
			const scopes = ["test", "scopes"];
			atom.config.set("eslint-format.scopes", scopes);
			const {grammars} = eslintFormat.provideCodeFormat();

			expect(scopes).toEqual(grammars);
		});
	});

	describe("formatCode", function () {
		it("should create a new worker", async function () {
			const testFile = fixturesPath("test.js");
			const editor = await atom.workspace.open(testFile);
			const range = new Range([0, 0], [0, 9]);
			const promise = eslintFormat.provideCodeFormat().formatCode(editor, range);

			expect(eslintFormat.workers.size).toBe(1);
			await promise;
		});

		it("should return an array of textEdit objects", async function () {
			// https://github.com/facebook/nuclide/blob/e9e11a8209e2133c0ae2a4156f0406184a052cb4/modules/nuclide-commons-atom/text-edit.js#L21
			const testFile = fixturesPath("test.js");
			const editor = await atom.workspace.open(testFile);
			const range = new Range([0, 0], [0, 9]);
			const textEdit = await eslintFormat.provideCodeFormat().formatCode(editor, range);

			expect(textEdit).toEqual([jasmine.objectContaining({
				oldRange: range,
				oldText: editor.getTextInBufferRange(range),
				newText: jasmine.any(String),
			})]);
		});
	});
});
