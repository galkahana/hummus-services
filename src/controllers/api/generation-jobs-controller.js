'use strict';

var generatedFilesController = require('./generated-files-controller'),
    jobPipeline = require('../../services/job-pipeline'),
    uuid = require('node-uuid');

var generationJobs = {};
var eJobDone = 0;
var eJobInProgress = 1;
var eJobFailed = 2;

function isGenerationJobReady(inJobID)
{
	return !generationJobs[inJobID] ||
			generationJobs[inJobID].status == eJobDone ||
			generationJobs[inJobID].status == eJobFailed;	
}

function pullGenerationJobResultAndStatus(inJobID)
{
	if(!generationJobs[inJobID])
		return {status:eJobFailed};

	return generationJobs[inJobID];
}

function startGenerationJob(inJobTicket)
{
	var jobID = uuid.v4();
	generationJobs[jobID] = {status:eJobInProgress,ticket:inJobTicket};
    jobPipeline.run(inJobTicket,function(err,result) {
        if(err) {
            generationJobs[jobID].status = eJobFailed;
            // TBD what to do with the actual err
        } else {
            generationJobs[jobID].status = eJobDone;
            generationJobs[jobID].generatedFileID =
                generatedFilesController.createGeneratedFileEntry(result.outputPath,result.outputTitle);
        }
    });
	return jobID;
}

function GenerationJobsController() {

    var jobParams = function(req, res, next) {
        return req.body;
    };

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

        if(generationJobs[req.params.id]) {
            var jobID = req.params.id;
    
            if(isGenerationJobReady(jobID))
            {
                var result = pullGenerationJobResultAndStatus(jobID);
                result.jobID = jobID;
                res.status(200).json(result);
            }
            else
                res.status(200).json({jobID:jobID,status:eJobInProgress});
        }
        else
            res.notFound('Could not find job: ' + jobID);    
    };

    /**
     * Post /generation-jobs
     * @param req request object
     * @param res response object
     * @param next callback handler
     * @returns {*} 201 and tag JSON
     */
    this.create = function(req, res, next) {
        var params = jobParams(req);
        if (!params) {
            return res.badRequest('Missing job data');
        }
        
        var jobID = startGenerationJob(params);
        if(isGenerationJobReady(jobID))
        {
            var result = pullGenerationJobResultAndStatus(jobID);
            result.jobID = jobID;
            res.status(200).json(result);
        }
        else
            res.status(200).json({jobID:jobID,status:eJobInProgress});
    };
}

module.exports = new GenerationJobsController();
