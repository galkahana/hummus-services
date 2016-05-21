var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    constants = require('./constants'),
    timestamps = require('./plugins/timestamps');

    
var fileDownloadedAccountingEventSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        require:true
    },
    token: {
        type: Schema.ObjectId,
        ref: 'AccessToken'
    },
    tokenString: {
        type: String
    },
    tokenType: {
        type:String,
        enum: constants.ETokenRoles
    },
    downloadedFile: {
        type: Schema.ObjectId,
        ref: 'GeneratedFile',
        require: true        
    },
    downloadedFileSize: {
        type: Number,
        require: true      
    },
    generatingJob: {
        type: Schema.ObjectId,
        ref: 'GenerationJob',
        require: true        
    }
});

// plugins
fileDownloadedAccountingEventSchema.plugin(timestamps, {index: true});
fileDownloadedAccountingEventSchema.index({user: 1});


module.exports = mongoose.model('FileDownloadedAccountingEvent', fileDownloadedAccountingEventSchema);