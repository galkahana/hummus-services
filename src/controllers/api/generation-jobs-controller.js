'use strict';

var jobPipeline = require('../../services/job-pipeline'),
    generationJobsService = require('../../services/generation-jobs'),
    generatedFilesService = require('../../services/generated-files'),
    accounting = require('../../services/accounting'),
    constants = require('../../models/constants'),
    async = require('async'),
    remoteStorageService = require('../../services/remote-storage-service'),
    logger = require('../../services/logger'),
    _ = require('lodash'),
    moment = require('moment'),
    crypto = require('crypto');

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
                callback(newErr || err,generatedFileEntry);
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

function hashMe(value) {
    return crypto.createHash('sha256').update(value).digest('base64');
}

function startGenerationJob(inJobTicket,user,token,callback)
{
    // create job entry
    generationJobsService.create({
        status:constants.eJobInProgress,
        label:(inJobTicket.meta && inJobTicket.meta.label) ? inJobTicket.meta.label:undefined,
        ticket:inJobTicket,
        user:user._id,
        deleteFileAfter: (inJobTicket.meta && inJobTicket.meta.deleteFileAfter) ? inJobTicket.meta.deleteFileAfter:undefined
    },function(err,job) {
        if(err) return callback(err);
        
        // start job code, async
        jobPipeline.run(inJobTicket,function(err,generationResult) {
            if(err) {
                // failed, update job entry
                logger.error('Job failed in file creation stage',job._id);
                logger.error(err);
                
                job.status = constants.eJobFailed;
                generationJobsService.update(job._id,job,function(){});
                accounting.logJobRanAccountingEvent(job,token);
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
                        }],
                        createPublicUrl: ['createFileEntryAndUpdateJob',function(callback,results) {
                            if(job.meta && job.meta.private) 
                                return callback(null,null);
                                
                            // create public download URL for PDF
                           var fileEntry = results.createFileEntryAndUpdateJob;
                           
                           fileEntry.publicDownloadId = hashMe(fileEntry._id.toString()) + 
                                                        hashMe(moment().format()) + 
                                                        hashMe(token.value);
                            fileEntry.save(function(err) {
                               callback(err,fileEntry); 
                            });

                        }]
                    },
                    function(err,results) {
                        if(err) {
                            logger.error('Job failed in file entry creation and upload stage',job._id);
                            job.status = constants.eJobFailed;
                            generationJobsService.update(job._id,job,function(){});
                            accounting.logJobRanAccountingEvent(job,token);                      
                            return;
                        }
                        
                        // on success, finally set the job status to done
                        logger.error('Job succeeded, finished OK',job._id);
                        job.status = constants.eJobDone;

                        // add killer date for file when done, if required
                        if(job.deleteFileAfter) {
                            job.deleteFileAt = moment().add({ms:job.deleteFileAfter});
                        }

                        generationJobsService.update(job._id,job);  
                        accounting.logJobRanAccountingEvent(job,token,generationResult.outputPath);
                    }
                );
            }
        });
        
        // return callback with status
        callback(null,job);        
        
    });
}

function limitToUserJobs(items,userId,callback) {
    generationJobsService.getAllIn(items,function(err, generationJobs){
        if(err) {
            logger.error('Error in fetching jobs for files delete',err);
            return callback(err);
        }
        callback(null,_.map(_.filter(generationJobs,function(job){
            return job.user.equals(userId)})),function(o){return o._id}); 
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
            return res.badRequest('Missing job id');
        }

        if (!req.user) {
            return res.badRequest('Missing user. should have user for identifying whose job it is');
        }

        generationJobsService.get(req.params.id,{populateGeneratedFile:req.query.full}, function(err, job) {
            if (err) { return next(err); }
            if(!job || !job.user.equals(req.user._id))
                return res.notFound();   
            res.status(200).json(job);
        });
    };

    /**
     * Post /generation-jobs
     */
    this.create = function(req, res, next) {
        var ticket = req.body,
            user = req.user,
            token = req.info.token;
        if (!ticket) {
            return res.badRequest('Missing job data');
        }
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying whose job it is');
        }
        if (!token) {
            return res.badRequest('Missing token. cant bill job. no billing, no job');
        }
        
        startGenerationJob(ticket,user,token,function(err,job) {
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
                limitToUserJobs(req.body.items,user._id,function(err,items) {
                    if (err) { return next(err); }

                    generationJobsService.deleteAllWithFiles(items,function(err) {
                        if (err) { return next(err); }
                        res.status(200).json({ok:true});
                    });
                })
                break;
            }
            case 'deleteFiles': {
                limitToUserJobs(req.body.items,user._id,function(err,items) {
                    if (err) { return next(err); }
                    generationJobsService.deleteFilesForJobs(items,function(err) {
                        if (err) { return next(err); }
                        res.status(200).json({ok:true});
                    });
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
