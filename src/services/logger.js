var moment = require('moment');

var logger = {};

function addConsoleLabel(args) {
	var newArgs = Array.prototype.slice.call(args);
	newArgs.unshift('[' + moment().format('MMM Do YYYY, HH:mm:ss') +']:');
	
	return newArgs;
	
}

['log','error','info'].forEach(function(fName) {
	logger[fName] = function() {
		console[fName].apply(console, addConsoleLabel(arguments));
	};
});

module.exports = logger;