var jobRanAccountingEventModel = require('../models/job-ran-accounting-events'),
    constants = require('../models/constants');


function JobRanAccountingEvents() {
    
}


JobRanAccountingEvents.prototype.getAccumulatedSizeFor = function(userId,startDate,endDate,callback) {
    jobRanAccountingEventModel
        .aggregate(
            [
                {
                    $match:{
                        user:userId,
                        $and: [
                            {createdAt: {$gte: startDate}},
                            {createdAt: {$lte: endDate}}
                        ],
                        tokenType: {$nin:[constants.eTokenRoleSiteUser,null]}                        
                    }
                },
                {
                    $group:{
                        _id:"$user",
                        count:{$sum:1},
                        size:{$sum:"$resultFileSize"}
                    }
                }
            ]
        )
        .exec(function(err,results) {
            if(err)
                return callback(err);
            if(results.length > 0) {
                callback(null,results[0])
            }
            else {
                callback(null,{count:0,size:0});
            }
        }); 
};

module.exports = new JobRanAccountingEvents();