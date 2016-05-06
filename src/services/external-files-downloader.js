var tmp = require('temporary'),
	http = require('http'),
	https = require('https'),
	async = require('async'),
	fs = require('fs'),
	logger = require('./logger');

function downloadFile(inFileURL,inTargetFilePath,inCallback)
{

	var file = fs.createWriteStream(inTargetFilePath);
	var theDownloadService = inFileURL.substring(0,5) == 'https' ? https:http;
	theDownloadService.get(inFileURL, function(response) {
  		response.pipe(file);
		file.on('finish', function() {
		      file.close(inCallback(null,inTargetFilePath));
		    });  		
	}).on('error', inCallback);	
}

module.exports = {
	/*
		Download externals per what is specified by the inExternals object.
		when done call inCallback with a copy of the externals object matching
		the keys to local files
	*/
	downloadExternals: function(inExternals,inCallback) {
		if(!inExternals || Object.keys(inExternals).length == 0)
		{
			inCallback(null,{});
			return;
		}
	
		var downloadMap = {};
	
		async.forEachOf(inExternals,
						function(inValue, inKey, cb) {
							downloadFile(inValue,
										new tmp.File().path,
										function(err,inTargetFilePath)
										{
											if(err) {
												return cb(err);
											}
											downloadMap[inKey] = inTargetFilePath;
											logger.log('downloaded',inKey,'from',inValue,'to',inTargetFilePath);
											cb();
										});

						},
						function(err) {
							inCallback(err,downloadMap);
						});
	},
	cleanExternals: function(externalMap) {
		for(var external in externalMap)
		{
			fs.unlink(externalMap[external]);
		}
	}
}