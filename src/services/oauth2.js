'use strict';
var passport = require('passport'),
    async = require('async'),
    User = require('../models/users'),
    AccessToken = require('../models/access-tokens'),
    RefreshToken = require('../models/refresh-tokens');

function generateTokens(user, client,options,done) {
    var tokenParams = {userId: user.id, clientId: client.clientId};
    
    // allow omitting options
    if(typeof options == 'function') {
        done = options;
        options = null;
    }
    
    if(options && options.tokenType) {
        tokenParams.tokenType = options.tokenType;
    }
    
    async.auto({
        removeRefreshToken: function (callback) {
            RefreshToken.remove(tokenParams, function(err) {
                if (err) { return callback(err); }
                callback(null);
            });
        },
        removeAccessToken: function (callback) {
            AccessToken.remove(tokenParams, function(err) {
                if (err) { return callback(err); }
                callback(null);
            });
        },
        createRefreshToken: ['removeRefreshToken', function (callback) {
            RefreshToken.create(tokenParams, function(err, refreshToken) {
                if (err) { return callback(err); }
                callback(null, refreshToken);
            });
        }],
        createAccessToken: ['removeAccessToken', function (callback) {
            AccessToken.create(tokenParams, function(err, accessToken) {
                if (err) { return callback(err); }
                callback(null, accessToken);
            });
        }]
    }, function(err, results) {
        if (err) { return done(err); }
        var accessTokenValue = results.createAccessToken.value,
            refreshTokenValue = results.createRefreshToken.value;
        done(null, refreshTokenValue, accessTokenValue);
    });
};

function revokeTokens(user, client,options,done) {
    var tokenParams = {userId: user.id, clientId: client.clientId};
    
    // allow omitting options
    if(typeof options == 'function') {
        done = options;
        options = null;
    }
    
    if(options && options.tokenType) {
        tokenParams.tokenType = options.tokenType;
    }
    
    async.auto({
        removeRefreshToken: function (callback) {
            RefreshToken.remove(tokenParams, function(err) {
                if (err) { return callback(err); }
                callback(null);
            });
        },
        removeAccessToken: function (callback) {
            AccessToken.remove(tokenParams, function(err) {
                if (err) { return callback(err); }
                callback(null);
            });
        },
    }, function(err, results) {
        done(err);
    });
};

function getAccessTokens(user,client,options,done) {
    var tokenParams = {userId: user.id, clientId: client.clientId};
    
    // allow omitting options
    if(typeof options == 'function') {
        done = options;
        options = null;
    }
    
    if(options && options.tokenTypes) {
        tokenParams.tokenType = {
            $in:options.tokenTypes
        }
    }
    AccessToken.find(tokenParams, done);
}

module.exports = {
    generateTokens : generateTokens,
    revokeTokens : revokeTokens,
    getAccessTokens : getAccessTokens
};
