var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps'),
    constants = require('./constants');



var generatedFileSchema = new Schema({
    downloadTitle: String,
    source: {
        sourceType: {
            type: Number,
            enum: constants.ESourceTypes,
            required: true
        },
        data: Schema.Types.Mixed
    } 
});

generatedFileSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('GeneratedFile', generatedFileSchema);