/** @babel */

import path from "path";

export default {
	fixturesPath(resolvePath = "") {
		return path.resolve(path.join(__dirname, "fixtures"), resolvePath);
	},

	projectPath(file) {
		const [projectPath] = (file ? atom.project.relativizePath(file) : atom.project.getPaths());
		return projectPath;
	}
};
