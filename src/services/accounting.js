var jobRanAccountingEvents = require('../models/job-ran-accounting-events'),
    fileDownloadedAccountingEvents = require('../models/file-downloaded-accounting-events'),
    generationsJobs = require('../models/generation-jobs'),
    fs = require('fs'),
    async = require('async');


function logJobRanAccountingEvent(job,token,filePath) {
    var data = {
        user: job.user,
        token: token._id,
        tokenString: token.value,
        tokenType: token.tokenType,
        job: job._id,
        jobStatus: job.status,
        resultFile: job.generatedFile
    };
    
    // now get the file size
    if(filePath) {
        fs.stat(filePath, function(err,stats) {
            data.resultFileSize = err ? 0:stats.size;
            jobRanAccountingEvents.create(data);
        });      
    }
    else {
        jobRanAccountingEvents.create(data);
    }
}

function logFileDownloadedAccountingEvent(fileEntry,options) {
    async.auto({
        'fetchGeneratingJobId' : function(cb) {
            generationsJobs
                .findOne({generatedFile:fileEntry._id})
                .exec(function(err,job) {
                    cb(err,(err || !job) ? null:job._id);
                });
        },
        'fetchFileSize' : function(cb) {
            if(options.sourceFileSize)
                cb(null,options.sourceFileSize);
            else if(options.sourceFileName) {
                fs.stat(options.sourceFileName, function(err,stats) {
                        cb(err,err ? 0:stats.size);
                    });                
            }
            else
                cb(null,0);
        }
    },
    function(err,results) {
        var data = {
            user: fileEntry.user,
            downloadedFile:fileEntry._id,
            downloadedFileSize: results.fetchFileSize,
            generatingJob: results.fetchGeneratingJobId
        };
        
        var token = options.token;
        if(token) {
            data.token = token._id;
            data.tokenString = token.value;
            data.tokenType = token.tokenType;
        }

        fileDownloadedAccountingEvents.create(data);
    });
}


module.exports = {
	logJobRanAccountingEvent:logJobRanAccountingEvent,
    logFileDownloadedAccountingEvent:logFileDownloadedAccountingEvent
};