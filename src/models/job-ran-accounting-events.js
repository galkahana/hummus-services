var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    constants = require('./constants'),
    timestamps = require('./plugins/timestamps');

    
var jobRanAccountingEventSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        require: true        
    },
    token: {
        type: Schema.ObjectId,
        ref: 'AccessToken',
        require: true        
    },
    tokenString: {
        type: String,
        required: true
    },
    tokenType: {
        type:String,
        enum: constants.ETokenRoles,
        require: true        
    },
    job: {
        type: Schema.ObjectId,
        ref: 'GenerationJob',
        require: true        
    },
    jobStatus: {
        type: Number,
        enum: constants.EJobStatuses,
        required: true
    },
    resultFile: {
        type: Schema.ObjectId,
        ref: 'GeneratedFile'
    },
    resultFileSize: {
        type: Number
    }
});

// plugins
jobRanAccountingEventSchema.plugin(timestamps, {index: true});
jobRanAccountingEventSchema.index({user: 1});

module.exports = mongoose.model('JobRanAccountingEvent', jobRanAccountingEventSchema);