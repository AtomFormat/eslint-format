/** @babel */

import {CompositeDisposable, Disposable, Task, Range} from "atom";
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
			formatCode: async (editor, range) => {
				const file = editor.getPath();
				const text = editor.getTextInBufferRange(range);
				const config = atom.config.get("eslint-format");
				const result = await this.runWorker(file, text, config);
				return this.formatFixes(editor, range, text, result, config);
			},
			priority: 1,
			grammars: atom.config.get("eslint-format.scopes"),
		};
	},

	formatFixes(editor, range, text, result, config) {
		if (editor.getTextInBufferRange(range) !== text) {
			// text has changed since running
			return [];
		}
		const [{messages}] = result.results;
		if (!messages || messages.length === 0) {
			// nothing to fix
			return [];
		}
		if (messages[0].fatal) {
			// eslint fatal error
			throw new Error(messages[0].message);
		}

		const buffer = editor.getBuffer();
		const startIndex = buffer.characterIndexForPosition(range.start);
		return messages.reduce((textEdits, message) => {
			if (message.fix && (!config.errorsOnly || message.severity === 2)) {
				const oldRange = new Range(
					buffer.positionForCharacterIndex(startIndex + message.fix.range[0]),
					buffer.positionForCharacterIndex(startIndex + message.fix.range[1])
				);
				const oldText = editor.getTextInBufferRange(oldRange);

				// https://github.com/facebook/nuclide/blob/e9e11a8209e2133c0ae2a4156f0406184a052cb4/modules/nuclide-commons-atom/text-edit.js#L21
				textEdits.unshift({
					newText: message.fix.text,
					oldText,
					oldRange,
				});
			}
			return textEdits;
		}, []);
	},

	runWorker(file, text, config) {
		const [projectPath] = (file ? atom.project.relativizePath(file) : atom.project.getPaths());
		const fileDir = (file ? path.dirname(file) : null);
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
