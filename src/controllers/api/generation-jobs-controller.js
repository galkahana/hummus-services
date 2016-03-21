'use strict';

var jobPipeline = require('../../services/job-pipeline'),
    generationJobsService = require('../../services/generation-jobs'),
    generatedFilesService = require('../../services/generated-files'),
    constants = require('../../models/constants'),
    async = require('async'),
    remoteStorageService = require('../../services/remote-storage-service');

function createFileEntryAndUpdateJob(job,user,result,callback) {
    generatedFilesService.create({
        downloadTitle: result.outputTitle,
        localSource: {
            sourceType: constants.eSourceLocal,
            data: {
                path: result.outputPath
            }
        },
        user:user._id 
    },function(err,generatedFileEntry) {
            if(err)
                job.status = constants.eJobFailed;
            else 
                job.generatedFile = generatedFileEntry._id;
            generationJobsService.update(job._id,job,function(err){
                callback(err,generatedFileEntry);
            });
        }
    );                    
}

function uploadPDF(filePath,user,callback) {
    remoteStorageService.uploadFile(filePath,user,callback);
}

function startGenerationJob(inJobTicket,user,callback)
{
    // create job entry
    generationJobsService.create({
        status:constants.eJobInProgress,
        ticket:inJobTicket,
        user:user._id
    },function(err,job) {
        if(err) return callback(err);
        
        // start job code, async
        jobPipeline.run(inJobTicket,function(err,result) {
            if(err) {
                // failed, update job entry
                job.status = constants.eJobFailed;
                generationJobsService.update(job._id,job,function(){});
            } else {
                // succeeded. 
                
                /*
                    Create a ready file entry and at the same time upload the prepared files.
                    The ready file entry creation won't wait for upload, relying on job status change later to be the final judge
                    for whether job is done.
                */
                async.auto(
                    {
                        createFileEntryAndUpdateJob: function(callback) {
                            // will put in results the generated file entry, so we can later update with
                            // upload data
                            createFileEntryAndUpdateJob(job,user,result,callback);
                        },
                        uploadPDF : function(callback) {
                            // will return with upload data that can be used to update the generated file entry
                            uploadPDF(result.outputPath,user,callback);
                        }
                    },
                    function(err,results) {
                        if(err) return;
                        
                        // when done both upload an file entlry creation, update generated file entry with the remote file information.
                        // Note again that one does not wait for declaring the job finished
                        // prior to uploading the data. In that case we still trust the local file to be around
                        // to be retrieved directly with no required download
                        var generatedFileEntry = results.createFileEntryAndUpdateJob;
                        var remoteSourceData = results.uploadPDF;
                        
                        generatedFileEntry.remoteSource = remoteSourceData;
                        
                        generatedFilesService.update(generatedFileEntry._id,generatedFileEntry,function(err,fileEntry) {
                            // on success, finally set the job status to done
                            job.status = constants.eJobDone;
                            generationJobsService.update(job._id,job);                            
                        });
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
}

module.exports = new GenerationJobsController();
