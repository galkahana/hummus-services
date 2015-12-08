var uuid = require('node-uuid'),
	fs = require('fs');


var readyFiles = {};

function serveFile(res,filePath,inMime,inWithFileName) {
	inMime = inMime || 'application/octet-stream';

	fs.exists(filePath,function(inExists)
	{
		if(inExists)
		{
			if(inWithFileName)
				res.writeHead(200, {'Content-Type': inMime,'Content-disposition':'attachment; filename=' + encodeURIComponent(inWithFileName)});
			else
				res.writeHead(200, {'Content-Type': inMime});
			fs.createReadStream(filePath).pipe(res);
		}
		else
		{
			res.notFound();
		}
	});
};


function GeneratedFilesController() {
	
	this.createGeneratedFileEntry = function(inFilePath,inDownloadTitle) {
		var id = uuid.v4();
		
		readyFiles[id] = {path:inFilePath,downloadTitle:inDownloadTitle};
		return id;
	}
	
    this.download = function(req, res, next) {
        if (!req.params.id) {
            return res.badRequest('Missing tag id');
        }

        var fileEntry = readyFiles[req.params.id];
        if(fileEntry)
            serveFile(res,fileEntry.path,'application/pdf',fileEntry.downloadTitle);
        else
            res.notFound('Not found file with ID',req.params.id);
    };
}

module.exports = new GeneratedFilesController();


