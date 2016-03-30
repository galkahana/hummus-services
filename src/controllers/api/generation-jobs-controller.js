'use strict';

var jobPipeline = require('../../services/job-pipeline'),
    generationJobsService = require('../../services/generation-jobs'),
    generatedFilesService = require('../../services/generated-files'),
    constants = require('../../models/constants'),
    async = require('async'),
    remoteStorageService = require('../../services/remote-storage-service'),
    logger = require('../../services/logger');

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

        generationJobsService.getAllOfUser(user,function(err, generationjobs) {
            if (err) { return next(err); }
            res.status(200).json(generationjobs);
        });        
    };
}

module.exports = new GenerationJobsController();
