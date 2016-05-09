var fs = require('fs'),
    _ = require('lodash'),
    generatedFilesService = require('../../services/generated-files'),
    remoteStorageService = require('../../services/remote-storage-service'),
    logger = require('../../services/logger');

function setupDownloadHeader(res,inMime,inWithFileName) {
	inMime = inMime || 'application/octet-stream';
    if(inWithFileName) {
        // make sure it ends with .pdf
        if(!_.endsWith(inWithFileName,'.pdf'))
            inWithFileName+='.pdf';
        
        res.writeHead(200, {'Content-Type': inMime,'Content-disposition':'attachment; filename=' + encodeURIComponent(inWithFileName)});
    }
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

function serveFileEntry(res,fileEntry,localPath,shouldDownload) {
    var targetFilename = shouldDownload ? (fileEntry.downloadTitle || fileEntry._id.toString()):null;
    if(localPath) {
        fs.exists(localPath,function(result) {
            if(result) {
                logger.log('Serving file entry',fileEntry._id,' from local source',fileEntry.localSource.data.path)
                serveFile(res,fileEntry.localSource.data.path,'application/pdf',targetFilename);
            } else {   
                logger.log('Cant find file, so serving file entry',fileEntry._id,' from remote source');
                downloadAndServe(res,fileEntry.remoteSource,'application/pdf',targetFilename);
            }
        });
    }
    else {
        logger.log('File is not local, so serving file entry',fileEntry._id,' from remote source');
        downloadAndServe(res,fileEntry.remoteSource,'application/pdf',targetFilename);
    }
}

function serve(req,res,next,shouldDownload) {
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
            
        serveFileEntry(res,fileEntry,localPath,shouldDownload);
    });
}

function servePublic(req,res,next,shouldDownload) {
    if(!req.params.publicDownloadId) {
        return res.badRequest('Missing file id');
    }
    
    
    generatedFilesService.getWithPublic(req.params.publicDownloadId, function(err, fileEntry, localPath) {
        if (err) { return next(err); }
        if(!fileEntry)
            return res.notFound();
            
        serveFileEntry(res,fileEntry,localPath,shouldDownload);
    });        
}

function GeneratedFilesController() {
	
    this.download = function(req, res, next) {
        serve(req,res,next,true);
    };

    this.embed = function(req, res, next) {
        serve(req,res,next);
    };

    this.downloadPublic = function(req,res,next)  {
        servePublic(req,res,next,true);
    }

    this.embedPublic = function(req,res,next)  {
        servePublic(req,res,next);
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
    
    this.list = function(req, res, next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying whose jobs are being queried');
        }
        
        // query by user
        var queryParams = {
            user:user._id
        };
        
        // add date range
        if(req.query.dateRangeFrom !== undefined ||
            req.query.dateRangeTo !== undefined) {
            var from = req.query.dateRangeFrom ? moment(req.query.dateRangeFrom).toDate():null;
            var to = req.query.dateRangeTo ? moment(req.query.dateRangeTo).toDate():null;
            
            if(to) {
                if(from) {
                    // both
                    queryParams.$or = [
                    {
                        $and: [
                            {createdAt: {$gte: from}},
                            {createdAt: {$lte: to}}
                        ]
                    },
                    {
                        $and: [
                            {updatedAt: { $ne : null }},
                            {updatedAt: {$gte: from}},
                            {updatedAt: {$lte: to}}
                        ]
                    }  
                    ];                    
                }  
                else {
                    // only to
                    queryParams.$or = [
                    {
                        createdAt: {$lte: to}
                    },
                    {
                        $and: [
                            {updatedAt: { $ne : null }},
                            {updatedAt: {$lte: to}}
                        ]
                    }  
                    ];                       
                }
            } else if(from) {
                // only from
                queryParams.$or = [
                {
                    createdAt: {$gte: from}
                },
                {
                    $and: [
                        {updatedAt: { $ne : null }},
                        {updatedAt: {$gte: from}}
                    ]
                }  
                ];                 
            }
        }

        // add specific ids        
        if(req.query.in !== undefined) {
            queryParams._id = {$in:req.query.in};            
        }

        generatedFilesService.findAllDesc(queryParams,function(err, generatedFiles) {
            if (err) { return next(err); }
            res.status(200).json(generatedFiles);
        });        
    };    
    
    
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


