var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps'),
    constants = require('./constants');


var generationJobSchema = new Schema({
    status: {
        type: Number,
        enum: constants.EJobStatuses,
        required: true
    },
    ticket: Schema.Types.Mixed,
    generatedFile: {
        type: Schema.ObjectId,
        ref: 'GeneratedFile'
    }
});

generationJobSchema.index({status: 1});
generationJobSchema.plugin(timestamps, {index: true});


module.exports = mongoose.model('GenerationJob', generationJobSchema);