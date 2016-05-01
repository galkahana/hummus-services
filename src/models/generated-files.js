var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps'),
    constants = require('./constants'),
    generationJobs = require('./generation-jobs');



var generatedFileSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User', 
        required: true       
    },
    downloadTitle: String,
    publicDownloadId: String,
    localSource: {
        sourceType: {
            type: Number,
            enum: constants.ESourceTypes
        },
        data: Schema.Types.Mixed
    },
    remoteSource: {
        sourceType: {
            type: Number,
            enum: constants.ESourceTypes
        },
        data: Schema.Types.Mixed
    } 
});

generatedFileSchema.pre('remove', function(next) {
    var thisID = this.id;
    var self = this;

    generationJobs.update({generatedFile:thisID}, {$set: {generatedFile: null}},function(err) {
        if (err) { return next(err); }
        next();
    });
});

generatedFileSchema.index({user: 1});
generatedFileSchema.index({publicDownloadId: 1});

generatedFileSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('GeneratedFile', generatedFileSchema);