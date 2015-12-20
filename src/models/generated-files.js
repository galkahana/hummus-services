var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps'),
    constants = require('./constants');



var generatedFileSchema = new Schema({
    downloadTitle: String,
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

generatedFileSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('GeneratedFile', generatedFileSchema);