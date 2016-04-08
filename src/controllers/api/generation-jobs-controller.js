'use strict';

var jobPipeline = require('../../services/job-pipeline'),
    generationJobsService = require('../../services/generation-jobs'),
    generatedFilesService = require('../../services/generated-files'),
    constants = require('../../models/constants'),
    async = require('async'),
    remoteStorageService = require('../../services/remote-storage-service'),
    logger = require('../../services/logger'),
    _ = require('lodash');

function createFileEntryAndUpdateJob(job,user,generationResult,remoteSourceData,callback) {
    generatedFilesService.create({
        downloadTitle: generationResult.outputTitle,
        localSource: {
            sourceType: constants.eSourceLocal,
            data: {
                path: generationResult.outputPath
            }
        },
        user:user._id,
        remoteSource:remoteSourceData 
    },function(err,generatedFileEntry) {
            if(err)
                job.status = constants.eJobFailed;
            else 
                job.generatedFile = generatedFileEntry._id;
            generationJobsService.update(job._id,job,function(newErr){
                callback(newErr || err);
            });
        }
    );                    
}

function uploadPDF(filePath,user,job,callback) {
    remoteStorageService.uploadFile(filePath,user,function(err,remoteSourceData) {
            if(err) {
                // if failed in upload, mark job as failed
                job.status = constants.eJobFailed;
                generationJobsService.update(job._id,job,function(newErr){
                    callback(newErr || err,remoteSourceData);
                });
            }
            else
                callback(null,remoteSourceData);
    });
}

function startGenerationJob(inJobTicket,user,callback)
{
    // create job entry
    generationJobsService.create({
        status:constants.eJobInProgress,
        label:(inJobTicket.meta && inJobTicket.meta.label) ? inJobTicket.meta.label:undefined,
        ticket:inJobTicket,
        user:user._id
    },function(err,job) {
        if(err) return callback(err);
        
        // start job code, async
        jobPipeline.run(inJobTicket,function(err,generationResult) {
            if(err) {
                // failed, update job entry
                logger.error('Job failed in file creation stage',job._id);
                
                job.status = constants.eJobFailed;
                generationJobsService.update(job._id,job,function(){});
            } else {
                // succeeded. 
                
                /*
                    upload PDF and later create file entry with both local and uploaded version data
                */
                async.auto(
                    {
                        uploadPDF : function(callback) {
                            // will return with upload data that can be used to update the generated file entry
                            uploadPDF(generationResult.outputPath,user,job,callback);
                        },
                        createFileEntryAndUpdateJob: ['uploadPDF',function(callback,results) {
                            createFileEntryAndUpdateJob(job,user,generationResult,results.uploadPDF,callback);
                        }]
                    },
                    function(err,results) {
                        if(err) {
                            logger.error('Job failed in file entry creation and upload stage',job._id);
                            return;
                        }
                        
                        // on success, finally set the job status to done
                        logger.error('Job succeeded, finished OK',job._id);
                        job.status = constants.eJobDone;
                        generationJobsService.update(job._id,job);                            
                    }
                );
            }
        });
        
        // return callback with status
        callback(null,job);        
        
    });
}

function deleteFilesForGeneratedFileIDs(generatedFilesIDs,callback) {
    /*
        Important! this one does not null gnerated file entries
    */
    generatedFilesService.getSome(generatedFilesIDs,function(err,items) {
        if(err)
            return callback(err);
        
        // remove files from remote storage
        remoteStorageService.removeFiles(
            _.filter(
                _.map(items,function(value){return value.remoteSource;}),
                function(value){return !!value;}),function(err) {
                    logger.info('Removed multiple files from remote storage');
                    
                    // remove generated files entries
                    generatedFilesService.destroyIn(generatedFilesIDs,callback);
                });
    });
}

function deleteAllWithFiles(items,callback) {
    async.series(
        [
            function(cb) {
                deleteFilesForJobIDsNoUpdate(items,cb);
            },
            function(cb) {
                logger.info('Deleting jobs');
                generationJobsService.destroyIn(items,
                    function(err) {
                        if(err) {
                            logger.error('Error in deleting jobs',err);
                        }
                        else 
                            logger.info('Succeeded Deleting multiple jobs');
                        cb(err);
                    });
            }
        ],callback
    );
}

function deleteFilesForJobIDsNoUpdate(items,callback) {
    var jobItems;
    
    async.series(
        [
            function(cb) {
                logger.info('Fetching job items for IDs');
                generationJobsService.getAllIn(items,function(err, generationJobs){
                   if(err) {
                        logger.error('Error in fetching jobs for files delete',err);
                        return cb(err);
                   }
                   jobItems = generationJobs;
                   cb(); 
                });
            },
            function(cb) {
                logger.info('Deleting files for jobs');
                deleteFilesForGeneratedFileIDs(
                    _.filter(_.map(jobItems,function(value){return value.generatedFile;}),function(value){return !!value;}),
                    function(err) {
                        if(err) {
                            logger.error('Error in deleting files for jobs',err);
                        }
                        else 
                            logger.info('Succeeded Deleting files for jobs');
                        cb(err);
                    });
            }
        ],callback
    );       
}

function deleteFilesForJobs(items,callback) {
    async.series(
        [
            function(cb) {
                deleteFilesForJobIDsNoUpdate(items,cb);
            },
            function(cb) {
                logger.info('Updating jobs with null files');
                generationJobsService.updateIn(items,
                    {generatedFile:null},
                    function(err) {
                        if(err) {
                            logger.error('Error in updating jobs',err);
                        }
                        else 
                            logger.info('Succeeded Updating multiple jobs by removing their files');
                        cb(err);
                    });
            }
        ],callback
    );    
}

function GenerationJobsController() {

    /**
     * GET /generation-jobs/:id
     * @param req request object with ID
     * @param res response object
     * @param next callback handler
     * @returns {*} 200 and tag JSON
     */
    this.show = function(req, res, next) {
        if (!req.params.id) {
            return res.badRequest('Missing tag id');
        }

        generationJobsService.get(req.params.id, function(err, job) {
            if (err) { return next(err); }
            res.status(200).json(job);
        });
    };

    /**
     * Post /generation-jobs
     */
    this.create = function(req, res, next) {
        var ticket = req.body;
        var user = req.user;
        if (!ticket) {
            return res.badRequest('Missing job data');
        }
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying whose job it is');
        }
        
        startGenerationJob(ticket,user,function(err,job) {
            if (err) { return res.unprocessable(err); }    
            
            res.status(200).json(job);        
        });        
    };
    
    this.list = function(req, res, next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying whose jobs are being queried');
        }
        
        // query by user
        var queryParams = {
            user:user._id
        };
        
        // add search term for title
        if(req.query.searchTerm !== undefined) {
            queryParams.label =  {$regex:'.*' + req.query.searchTerm  + '.*',$options:'i'};
        }
        
        if(req.query.in !== undefined) {
            queryParams._id = {$in:req.query.in};            
        }

        generationJobsService.findAllDesc(queryParams,function(err, generationjobs) {
            if (err) { return next(err); }
            res.status(200).json(generationjobs);
        });        
    };
    
    this.actions = function(req,res,next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying whose jobs are being manipulated');
        }
        
        var type = req.body.type;
        if(!type) {
            return res.badRequest('Missing type. should be deleteAll or deleteFiles');
        }
        
        switch(type) {
            case 'deleteAll': {
                deleteAllWithFiles(req.body.items,function(err) {
                    if (err) { return next(err); }
                    res.status(200).json({ok:true});
                });
                break;
            }
            case 'deleteFiles': {
                deleteFilesForJobs(req.body.items,function(err) {
                    if (err) { return next(err); }
                    res.status(200).json({ok:true});
                });
                break;
                
            }
            default: {
                res.badRequest('Unknown type. should be deleteAll');
            }
        }
        
    }
}

module.exports = new GenerationJobsController();
