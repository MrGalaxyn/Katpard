/**
 * A simple wrapper for ansicolors npm module
 *
 * Makes it noop when the stdout is not a TTY
 */
'use strict';
var require = patchRequire(require);
var stdout = require('system').stdout;
var colors = require('ansicolors'),
	disableColors;

if (typeof stdout !== 'undefined') {
	// nodejs
	disableColors = !stdout.isTTY;
}
else {
	// PhantomJS
	disableColors = !!(require('system').env.BW);
}

function nop(str) {
	return str;
}

if (disableColors) {
	Object.keys(colors).forEach(function(key) {
		colors[key] = nop;
	});
}

module.exports = colors;
