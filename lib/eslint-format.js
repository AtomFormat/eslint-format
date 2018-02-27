/** @babel */

import {CompositeDisposable, Disposable, Task} from "atom";
import path from "path";

export default {
	config: {
		defaultConfig: {
			title: ".eslintrc.json Path",
			description: "It will only be used when there's no config file in the project",
			type: "string",
			default: atom.getConfigDirPath(),
		},
		errorsOnly: {
			description: "Fix errors but leave warnings",
			type: "boolean",
			default: false,
		},
		scopes: {
			title: "List of scopes to run ESLint on.",
			description: "Run `Editor: Log Cursor Scope` to determine the scopes for a file.",
			type: "array",
			default: [
				"source.json",
				"source.js",
				"source.jsx",
				"source.js.jsx",
				"source.babel",
				"source.js-semantic"
			],
		},
	},

	/**
	 * Activate package
	 * @return {void}
	 */
	activate() {
		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.disposables = new CompositeDisposable();
		this.workers = new Set();
		this.disposables.add(new Disposable(() => {
			this.workers.forEach((worker) => {
				if (worker) {
					worker.terminate();
				}
			});
			this.workers.clear();
		}));
		this.workerFile = require.resolve("./worker.js");
	},

	/**
	 * Deactivate package
	 * @return {void}
	 */
	deactivate() {
		this.disposables.dispose();
	},

	/**
	 * Provide formatter for code range
	 * @return {object} {formatCode, priority, grammars}
	 */
	provideRangeCodeFormat() {
		return {
			formatCode: async (editor, range) => {
				if (!range) {
					// eslint-disable-next-line no-param-reassign
					range = editor.getBuffer().getRange();
				}
				const file = editor.getPath();
				const text = editor.getTextInBufferRange(range);
				const config = atom.config.get("eslint-format");
				const [projectPath] = (file ? atom.project.relativizePath(file) : atom.project.getPaths());
				const fileDir = (file ? path.dirname(file) : null);
				const result = await this.runWorker(fileDir, projectPath, text, config);
				return this.formatFixes(editor, range, text, result);
			},
			priority: 1,
			grammars: atom.config.get("eslint-format.scopes"),
		};
	},

	/**
	 * Provide formatter for on save
	 * @return {object} {formatCode, priority, grammars}
	 */
	provideOnSaveCodeFormat() {
		return this.provideRangeCodeFormat();
	},

	formatFixes(editor, range, text, result) {
		if (editor.getTextInBufferRange(range) !== text) {
			// text has changed since running
			return [];
		}
		const [{messages}] = result.results;
		if (messages.length > 0 && messages[0].fatal) {
			// eslint fatal error
			throw new Error(messages[0].message);
		}

		const [{output}] = result.results;

		if (!output || text === output) {
			// nothing fixed
			return [];
		}

		return [{
			newText: output,
			oldText: text,
			oldRange: range,
		}];
	},

	runWorker(fileDir, projectPath, text, config) {
		return new Promise((resolve, reject) => {
			const task = Task.once(
				this.workerFile,
				fileDir,
				projectPath,
				text,
				config,
				(result) => {
					resolve(result);
					this.workers.delete(task);
					disposable.dispose();
				},
			);
			this.workers.add(task);
			const disposable = task.on("task:error", e => reject(e));
			this.disposables.add(disposable);
		});
	},
};
