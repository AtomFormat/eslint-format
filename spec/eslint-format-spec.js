/** @babel */

import eslintFormat from "../lib/eslint-format";

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
});
