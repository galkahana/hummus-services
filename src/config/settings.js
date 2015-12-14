var fs = require('fs');
var config = {};


module.exports = {
	load: function(cb) {
		fs.readFile(__dirname + '/config.json','utf8',function(err,data) {
			if(err) return cb(err);
			config = JSON.parse(data);
			cb(null,config);
		});
	},
	getConfig: function() {
		return config;
	} 
}