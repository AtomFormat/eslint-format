import path from "path";

export default function (editor, text, config) {

	let {defaultConfig} = config;
	if (defaultConfig.match(/\.eslintrc\./)) {
		defaultConfig = path.dirname(defaultConfig);
	}

	const filePath = editor.getPath();

	const dir = (filePath ? path.dirname(filePath) : defaultConfig);
	const [projectPath] = (filePath ? atom.project.relativizePath(filePath) : atom.project.getPaths());

	const importPath = path.join(projectPath || dir, "node_modules", "eslint");
	let eslint;
	try {
		eslint = require(importPath);
	} catch (error) {
		eslint = require("eslint");
	}

	let fix = true;
	if (config.errorsOnly) {
		fix = (rule => rule.severity === 2);
	}

	const eslintExecute = function (cwd) {
		const cli = new eslint.CLIEngine({fix, cwd});
		const [result] = cli.executeOnText(text).results;
		const [{fatal, message}] = result.messages;
		if (fatal) {
			throw new Error(message);
		}

		// TODO: get ranges from result.messages[].fix https://eslint.org/docs/developer-guide/nodejs-api#cliengineexecuteonfiles
		return result.output;
	};

	try {
		return eslintExecute(projectPath || dir);
	} catch (err) {

		// check for default config
		if ((err.message === "No ESLint configuration found.") && (filePath || projectPath)) {
			try {
				return eslintExecute(defaultConfig);
			} catch (error1) {
				throw err;
			}
		} else {
			throw err;
		}
	}
};
