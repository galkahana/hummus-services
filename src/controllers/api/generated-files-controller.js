var fs = require('fs'),
    generatedFilesService = require('../../services/generated-files'),
    remoteStorageService = require('../../services/remote-storage-service'),
    logger = require('../../services/logger');

function setupDownloadHeader(res,inMime,inWithFileName) {
	inMime = inMime || 'application/octet-stream';
    if(inWithFileName)
        res.writeHead(200, {'Content-Type': inMime,'Content-disposition':'attachment; filename=' + encodeURIComponent(inWithFileName)});
    else
        res.writeHead(200, {'Content-Type': inMime});
}

function serveFile(res,filePath,inMime,inWithFileName) {
	fs.exists(filePath,function(inExists)
	{
        setupDownloadHeader(res,inMime,inWithFileName);
		if(inExists)
			fs.createReadStream(filePath).pipe(res);
		else
			res.notFound();
	});
};

function downloadAndServe(res,remoteSourceData,inMime,inWithFileName) {
    setupDownloadHeader(res,inMime,inWithFileName);
    remoteStorageService.downloadFileToStream(remoteSourceData,res);
}


function GeneratedFilesController() {
	
    this.download = function(req, res, next) {
        if (!req.params.id) {
            return res.badRequest('Missing tag id');
        }
		
        generatedFilesService.get(req.params.id, function(err, fileEntry, localPath) {
            if (err) { return next(err); }
            if(localPath) {
                fs.exists(localPath,function(result) {
                    if(result) {
                        logger.log('Serving file entry',fileEntry._id,' from local source',fileEntry.localSource.data.path)
                        serveFile(res,fileEntry.localSource.data.path,'application/pdf',fileEntry.downloadTitle);
                    } else {   
                        logger.log('Cant find file, so serving file entry',fileEntry._id,' from remote source');
                        downloadAndServe(res,fileEntry.remoteSource,'application/pdf',fileEntry.downloadTitle);
                    }
                });
            }
            else {
                logger.log('File is not local, so serving file entry',fileEntry._id,' from remote source');
                downloadAndServe(res,fileEntry.remoteSource,'application/pdf',fileEntry.downloadTitle);
            }
        });

    };
}

module.exports = new GeneratedFilesController();


