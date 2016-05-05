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
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        require: true        
    },
    label: String,
    ticket: Schema.Types.Mixed,
    generatedFile: {
        type: Schema.ObjectId,
        ref: 'GeneratedFile'
    }
});

generationJobSchema.index({status: 1});
generationJobSchema.index({user: 1});
generationJobSchema.plugin(timestamps, {index: true});

// limit fields when going public
var GENERATION_JOB_PRIVATE_FIELDS = ['user'];
generationJobSchema.set('toJSON', { 
    transform: function (doc, ret, options) {
        /*
            remove black listed fields
        */
        GENERATION_JOB_PRIVATE_FIELDS.forEach(function(fn) {
           delete ret[fn]; 
        });
        
    }
});

module.exports = mongoose.model('GenerationJob', generationJobSchema);