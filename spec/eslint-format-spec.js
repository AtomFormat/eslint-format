/** @babel */

import eslintFormat from "../lib/eslint-format";
import path from "path";
import {Range} from "atom";

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
			const simpleFile = path.join(__dirname, "fixtures", "simple.js");
			const editor = await atom.workspace.open(simpleFile);
			const range = new Range([0, 0], [0, 9]);
			eslintFormat.provideCodeFormat().formatCode(editor, range);

			expect(eslintFormat.workers.size).toBe(1);
		});
	});
});
