/** @babel */

import path from "path";

export default {
	fixturesPath(resolvePath = "") {
		return path.resolve(path.join(__dirname, "fixtures"), resolvePath);
	},

	projectPath(file) {
		const [projectPath] = (file ? atom.project.relativizePath(file) : atom.project.getPaths());
		return projectPath;
	},

	mockConfig() {
		const mockSettings = {};
		spyOn(atom.config, "get").and.callFake((keyPath) => {
			let value = getValueAtKeyPath(mockSettings, keyPath);
			if (typeof value === "undefined") {
				value = getValueAtKeyPath(atom.config.defaultSettings, keyPath);
			}
			return value;
		});
		spyOn(atom.config, "set").and.callFake((keyPath, value) => {
			setValueAtKeyPath(mockSettings, keyPath, value);

		});
	},
};

// modified from https://github.com/atom/key-path-helpers/blob/c4b753b535558eb804f448991b7602a8b72be475/lib/key-path-helpers.js
function getValueAtKeyPath(object, keyPath) {
	if (!keyPath) {
		return object;
	}

	let obj = object;

	var keys = splitKeyPath(keyPath);
	for (var i = 0, len = keys.length; i < len; i++) {
		var key = keys[i];
		obj = obj[key];
		if (!obj) {
			return obj;
		}
	}
	return obj;
}

function setValueAtKeyPath(object, keyPath, value) {
	let obj = object;
	var keys = splitKeyPath(keyPath);
	while (keys.length > 1) {
		var key = keys.shift();
		if (!obj[key]) {
			obj[key] = {};
		}
		obj = obj[key];
	}
	obj[keys.shift()] = value;
}

function splitKeyPath(keyPath) {
	if (typeof keyPath !== "string") {
		return [];
	}

	var startIndex = 0, keyPathArray = [];
	for (var i = 0, len = keyPath.length; i < len; i++) {
		var char = keyPath[i];
		if (char === "." && (i === 0 || keyPath[i - 1] !== "\\")) {
			keyPathArray.push(keyPath.substring(startIndex, i).replace(/\\\./g, "."));
			startIndex = i + 1;
		}
	}
	keyPathArray.push(keyPath.substr(startIndex, keyPath.length).replace(/\\\./g, "."));

	return keyPathArray;
}
