var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps'),
    crypto = require('crypto'),
    base64url = require('base64url'),
    constants = require('./constants');
    
var accessTokenSchema = new Schema({
    value: {
        type: String,
        required: true,
        unique: true,
        default: function() { return base64url(crypto.randomBytes(64)); }
    },
    userId: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    clientId: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        uppercase: true,
        enum: ['BASIC'],
        default: 'BASIC',
        required: true
    },
    tokenType: {
     type:String,
     enum: constants.ETokenRoles
    }
});

// Indexes
accessTokenSchema.index({userId: 1, clientId: 1, provider: 1, tokenType: 1}, { unique: true });
accessTokenSchema.index({value: 1}, { unique: true });

// Plugins
accessTokenSchema.plugin(timestamps, {index: true});


module.exports = mongoose.model('AccessToken', accessTokenSchema);