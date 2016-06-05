'use strict';

var jobRanAccountingEvents = require('../../services/job-ran-accounting-events');

function AccountingController() {
    this.getTotalJobsCount = function(req,res,next) {
        
        jobRanAccountingEvents.getTotalJobsCount(function(err,count) {
            if (err) { 
                return next(err); 
            }
            res.status(200).json({count:count});
        });
    }
}


module.exports = new AccountingController();