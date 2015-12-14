'use strict';

var jobPipeline = require('../../services/job-pipeline'),
    generationJobsService = require('../../services/generation-jobs'),
    generatedFilesService = require('../../services/generated-files'),
    constants = require('../../models/constants');

function startGenerationJob(inJobTicket,callback)
{
    // create job entry
    generationJobsService.create({
        status:constants.eJobInProgress,
        ticket:inJobTicket
    },function(err,job) {
        if(err) return callback(err);
        
        // start job code, async
        jobPipeline.run(inJobTicket,function(err,result) {
            if(err) {
                // failed, update job entry
                job.status = constants.eJobFailed;
                generationJobsService.update(job._id,job,function(){});
            } else {
                // succeeded. create generated file entry and update job entry
                job.status = constants.eJobDone;
                generatedFilesService.create({
                    downloadTitle: result.outputTitle,
                    source: {
                        sourceType: constants.eSourceLocal,
                        data: {
                            path: result.outputPath
                        }
                    }                     
                },function(err,generatedFileEntry) {
                        if(err)
                            job.status = constants.eJobFailed;
                        else 
                            job.generatedFile = generatedFileEntry._id;
                        generationJobsService.update(job._id,job,function(){});
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
        if (!ticket) {
            return res.badRequest('Missing job data');
        }
        
        startGenerationJob(ticket,function(err,job) {
            if (err) { return res.unprocessable(err); }    
            
            res.status(200).json(job);        
        });        
    };
}

module.exports = new GenerationJobsController();
