/** @babel */

import path from "path";

export default {
	fixturesPath(resolvePath = "") {
		return path.resolve(path.join(__dirname, "fixtures"), resolvePath);
	},
};
