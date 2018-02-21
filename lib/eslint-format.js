/** @babel */

import {CompositeDisposable, Disposable, Task} from "atom";

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
				"source.ts", // TODO: not sure about these
				"source.tsx", // TODO: not sure about these
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
	provideCodeFormat() {
		return {
			formatCode: (editor, range) => {
				const text = editor.getTextInBufferRange(range);
				const file = editor.getPath();
				return this.startWorker(file, text);
			},
			priority: 1,
			grammars: atom.config.get("eslint-format.scopes"),
		};
	},

	startWorker(file, text) {
		return new Promise((resolve, reject) => {
			const task = Task.once(
				this.workerFile,
				file,
				text,
				atom.config.get("eslint-format"),
				(formattedText) => {
					this.workers.delete(task);
					disposable.dispose();
					resolve(formattedText);
				},
			);
			this.workers.add(task);
			const disposable = task.on("task:error", e => reject(e));
			this.disposables.add(disposable);
		});
	},
};
