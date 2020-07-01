/** @babel */

import path from "path";

async function worker(fileDir, projectPath, text, config) {
	const callback = this.async ? this.async() : () => {};
	const defaultConfig = worker.getDefaultConfig(config.defaultConfig);
	const eslint = worker.getEslint(projectPath || fileDir);
	const fix = (config.errorsOnly ? (rule => rule.severity === 2) : true);
	const cwd = (fileDir || projectPath || defaultConfig);

	let result;
	try {
		result = await worker.execute(eslint, text, {fix, cwd});
	} catch (err) {

		// check for default config
		if (err.message === "No ESLint configuration found." && cwd !== defaultConfig) {
			try {
				result = await worker.execute(eslint, text, {fix, cwd: defaultConfig});
			} catch (err2) {
				throw err;
			}
		} else {
			throw err;
		}
	} finally {
		callback(result);
	}
	return result;
};

worker.getEslint = function (dir) {
	if (dir) {
		const importPath = path.join(dir, "node_modules", "eslint");
		try {
			return require(importPath);
		} catch (err) {
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
	if (eslint.CLIEngine) {
		const {results} = new eslint.CLIEngine(config).executeOnText(text);
		return results;
	}

	if (config.rules) {
		config.overrideConfig = {
			rules: config.rules,
		};
		delete config.rules;
	}

	return new eslint.ESLint(config).lintText(text);
};

export default worker;
