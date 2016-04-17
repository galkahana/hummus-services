var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps');

    
var clientSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    clientId: {
        type: String,
        unique: true,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    }
});


// plugins
clientSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('Client', clientSchema);