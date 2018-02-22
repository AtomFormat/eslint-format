/** @babel */

import path from "path";

function worker(file, text, config) {

	const defaultConfig = worker.getDefaultConfig(config.defaultConfig);

	const dir = (file ? path.dirname(file) : defaultConfig);
	const [projectPath] = (file ? atom.project.relativizePath(file) : atom.project.getPaths());

	const eslint = worker.getEslint(projectPath || dir);

	const fix = (config.errorsOnly ? (rule => rule.severity === 2) : true);

	try {
		return worker.execute(eslint, text, {fix, cwd: projectPath || dir});
	} catch (err) {

		// check for default config
		if ((err.message === "No ESLint configuration found.") && (file || projectPath)) {
			try {
				return worker.execute(eslint, text, {fix, cwd: defaultConfig});
			} catch (error1) {
				throw err;
			}
		} else {
			throw err;
		}
	}
};

worker.getEslint = function (dir) {
	const importPath = path.join(dir, "node_modules", "eslint");
	try {
		return require(importPath);
	} catch (error) {
		return require("eslint");
	}
};

worker.getDefaultConfig = function (config) {
	let defaultConfig = config;
	if (/\.eslintrc\./.test(defaultConfig)) {
		defaultConfig = path.dirname(defaultConfig);
	}
	return defaultConfig;
};

worker.execute = function (eslint, text, config) {
	const cli = new eslint.CLIEngine(config);
	const [result] = cli.executeOnText(text).results;

	if (result.messages.length > 0) {
		const [{fatal, message}] = result.messages;
		if (fatal) {
			throw new Error(message);
		}
	}

	if (result.output) {
		// TODO: get ranges from result.messages[].fix https://eslint.org/docs/developer-guide/nodejs-api#cliengineexecuteonfiles
		return result.output;
	}

	return text;
};

export default worker;
