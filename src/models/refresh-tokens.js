'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps'),
    crypto = require('crypto'),
    base64url = require('base64url'),
    constants = require('./constants');

var refreshTokenSchema = new Schema({
    value: {
        type: String,
        required: true,
        unique: true,
        default: function() { return base64url(crypto.randomBytes(64)); }
    },
    userId: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    tokenType: {
     type:String,
     enum: constants.ETokenRoles
    }

});

// Indexes
refreshTokenSchema.index({userId: 1, clientId: 1, tokenType:1}, {unique: true});
refreshTokenSchema.index({value: 1}, { unique: true });

// Plugins
refreshTokenSchema.plugin(timestamps, {index: true});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
