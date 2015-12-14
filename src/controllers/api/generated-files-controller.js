var fs = require('fs'),
    generatedFilesService = require('../../services/generated-files');

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
	
    this.download = function(req, res, next) {
        if (!req.params.id) {
            return res.badRequest('Missing tag id');
        }
		
        generatedFilesService.get(req.params.id, function(err, fileEntry) {
            if (err) { return next(err); }
			// can handle only locals anyways, right now, so assume that it is
            serveFile(res,fileEntry.source.data.path,'application/pdf',fileEntry.downloadTitle);
        });

    };
}

module.exports = new GeneratedFilesController();


