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

function removeRemoteAndDeleteEntry(res,entry) {
    logger.log('Removing remote file',entry.remoteSource);
    remoteStorageService.removeFile(entry.remoteSource,function(err) {
        if(err)
            return res.unprocessable(err);

        logger.log('Succeeded in removing remote file',entry.remoteSource);
        // now delete the entry using the entry so the middlewares get into work
        entry.remove(function(err) {
            if (err) 
                return res.unprocessable(err);

            logger.log('Now also removed remote file entry',entry.remoteSource,'entry ID = ',entry._id);
            res.sendStatus(204);
        });
    });
}

function GeneratedFilesController() {
	
    this.download = function(req, res, next) {
        if (!req.params.id) {
            return res.badRequest('Missing file id');
        }

        if (!req.user) {
            return res.badRequest('Missing user. should have user for identifying whose job it is');
        }

		
        generatedFilesService.get(req.params.id, function(err, fileEntry, localPath) {
            if (err) { return next(err); }
            if(!fileEntry || !fileEntry.user.equals(req.user._id))
                return res.notFound();   
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
    
    this.downloadPublic = function(req,res,next)  {
        if(!req.params.publicDownloadId) {
            return res.badRequest('Missing file id');
        }
        
        
        generatedFilesService.getWithPublic(req.params.publicDownloadId, function(err, fileEntry, localPath) {
            if (err) { return next(err); }
            if(!fileEntry)
                return res.notFound();   
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
    }
    
    this.show = function(req,res, next) {
        if (!req.params.id) {
            return res.badRequest('Missing file id');
        }
		
        if (!req.user) {
            return res.badRequest('Missing user for action');
        }        
        
        generatedFilesService.get(req.params.id, function(err, fileEntry, localPath) {
            if (err) { return next(err); }
            if(!fileEntry || !fileEntry.user.equals(req.user._id))
                return res.notFound();   
            res.status(200).json(fileEntry);
        });  
    }
    
    this.delete = function(req,res,next) {
        if (!req.params.id) {
            return res.badRequest('Missing file id');
        }
        
        if (!req.user) {
            return res.badRequest('Missing user for action');
        }        
        
        generatedFilesService.get(req.params.id, function(err, fileEntry, localPath) {
            if (err) { return next(err); }
            if(!fileEntry || !fileEntry.user.equals(req.user._id))
                return res.notFound();   
                             
            if(localPath) {
                fs.exists(localPath,function(result) {
                    if(result) {
                        fs.unlink(localPath); // remove local path
                        logger.log('removing file at local path',localPath,'for file entry',fileEntry._id);
                    }
                    removeRemoteAndDeleteEntry(res,fileEntry);
                });
            }
            else {
                removeRemoteAndDeleteEntry(res,fileEntry);
            }
        });        
    }
}

module.exports = new GeneratedFilesController();


