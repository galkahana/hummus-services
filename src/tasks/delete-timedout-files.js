
/*var	logger = require('../services/logger'),
    configuration = require('../config/tasks-config'),
    generationJobsService = require('../services/generation-jobs');

logger.log('starting manual delete-timedout-files');
configuration.config(function() {
    generationJobsService.deleteTimedoutFiles(function(err) {
        configuration.deconfig(function() {
        logger.log('finishing manual delete-timedout-files');
        });
    });
});*/


'use strict';

var generationJobsService = require('../services/generation-jobs');

function DeleteTimedoutFilesTask() {
    this.run = function(req,res,next) {
        generationJobsService.deleteTimedoutFiles(function(err) {
            if (err) { 
                return next(err); 
            }
            res.status(200).json({ok:true});
        });
    }
}


module.exports = new DeleteTimedoutFilesTask();