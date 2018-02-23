/** @babel */

import path from "path";

function worker(fileDir, projectPath, text, config) {

	const defaultConfig = worker.getDefaultConfig(config.defaultConfig);

	const eslint = worker.getEslint(projectPath || fileDir);

	try {
		return worker.execute(eslint, text, {cwd: fileDir || projectPath || defaultConfig});
	} catch (err) {

		// check for default config
		if ((err.message === "No ESLint configuration found.") && (fileDir || projectPath)) {
			try {
				return worker.execute(eslint, text, {cwd: defaultConfig});
			} catch (error1) {
				throw err;
			}
		} else {
			throw err;
		}
	}
};

worker.getEslint = function (dir) {
	if (dir) {
		const importPath = path.join(dir, "node_modules", "eslint");
		try {
			return require(importPath);
		} catch (error) {
			return require("eslint");
		}
	}
	return require("eslint");
};

worker.getDefaultConfig = function (config) {
	let defaultConfig = config;
	if (/\.eslintrc\./.test(defaultConfig)) {
		defaultConfig = path.dirname(defaultConfig);
	}
	return defaultConfig;
};

worker.execute = function (eslint, text, config) {
	return new eslint.CLIEngine(config).executeOnText(text);
};

export default worker;
