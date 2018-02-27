/** @babel */

import path from "path";

function worker(fileDir, projectPath, text, config) {
	const defaultConfig = worker.getDefaultConfig(config.defaultConfig);
	const eslint = worker.getEslint(projectPath || fileDir);
	const fix = (config.errorsOnly ? (rule => rule.severity === 2) : true);
	const cwd = (fileDir || projectPath || defaultConfig);

	try {
		return worker.execute(eslint, text, {fix, cwd});
	} catch (err) {

		// check for default config
		if ((err.message === "No ESLint configuration found.") && cwd !== defaultConfig) {
			try {
				return worker.execute(eslint, text, {fix, cwd: defaultConfig});
			} catch (err2) {
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
