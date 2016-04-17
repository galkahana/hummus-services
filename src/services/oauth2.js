'use strict';

/**
 * Created by asafam on 1/6/15.
 */

var passport = require('passport'),
    async = require('async'),
    User = require('../models/users'),
    AccessToken = require('../models/access-tokens'),
    RefreshToken = require('../models/refresh-tokens');

var generateTokens = function(user, client, done) {
    async.auto({
        removeRefreshToken: function (callback) {
            RefreshToken.remove({userId: user.id, clientId: client.clientId}, function(err) {
                if (err) { return callback(err); }
                callback(null);
            });
        },
        removeAccessToken: function (callback) {
            AccessToken.remove({userId: user.id, clientId: client.clientId}, function(err) {
                if (err) { return callback(err); }
                callback(null);
            });
        },
        createRefreshToken: ['removeRefreshToken', function (callback) {
            RefreshToken.create({userId: user.id, clientId: client.clientId}, function(err, refreshToken) {
                if (err) { return callback(err); }
                callback(null, refreshToken);
            });
        }],
        createAccessToken: ['removeAccessToken', function (callback) {
            AccessToken.create({userId: user.id, clientId: client.clientId}, function(err, accessToken) {
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

module.exports.generateTokens = generateTokens;
