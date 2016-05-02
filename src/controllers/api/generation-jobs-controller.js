'use strict';

var jobPipeline = require('../../services/job-pipeline'),
    generationJobsService = require('../../services/generation-jobs'),
    generatedFilesService = require('../../services/generated-files'),
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

function startGenerationJob(inJobTicket,user,creatorId,callback)
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
                        }],
                        createPublicUrl: ['createFileEntryAndUpdateJob',function(callback,results) {
                            if(job.meta && job.meta.private) 
                                return callback(null,null);
                                
                            // create public download URL for PDF
                           var fileEntry = results.createFileEntryAndUpdateJob;
                           
                           fileEntry.publicDownloadId = hashMe(fileEntry._id.toString()) + 
                                                        hashMe(moment().format()) + 
                                                        hashMe(creatorId);
                            fileEntry.save(function(err) {
                               callback(err,fileEntry); 
                            });

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
        var ticket = req.body;
        var user = req.user;
        if (!ticket) {
            return res.badRequest('Missing job data');
        }
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying whose job it is');
        }
        
        startGenerationJob(ticket,user,req.info && req.info.accessToken ? req.info.accessToken:user._id,function(err,job) {
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
        if(req.query.dateRangeFrom !== undefined &&
            req.query.dateRangeTo !== undefined) {
            var from = moment(req.query.dateRangeFrom).toDate();
            var to = moment(req.query.dateRangeTo).toDate();
            
            to.setDate(to.getDate() + 1); // inclusive
            
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

                    deleteAllWithFiles(items,function(err) {
                        if (err) { return next(err); }
                        res.status(200).json({ok:true});
                    });
                })
                break;
            }
            case 'deleteFiles': {
                limitToUserJobs(req.body.items,user._id,function(err,items) {
                    if (err) { return next(err); }
                    deleteFilesForJobs(items,function(err) {
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
