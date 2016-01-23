'use strict';

var mongoose = require('mongoose'),
    log = require('../services/logger');

function Database() {

    this.dbInit = function(inDBURL,cb){
        this.connect(inDBURL);
        this.onConnect(cb);
    };

    /**
     * This method establish a connection to the DB
     */
    this.connect = function(inDBURL) {
        var uri = inDBURL || process.env.MONGODB_URI;

        if (!uri) {
            log.error('Mongoose URI is missing. Please set it and restart the app');
            return;
        }

        log.info('Connecting to mongodb: ' + sanitizeURI(uri));

        switch(mongoose.connection.readyState) {
            case 0:
                mongoose.connect(uri);
                break;
            case 1:
                log.error('Already connected to mongodb: ' + sanitizeURI(uri));
                break;

            default:
                log.info('Connecting to mongodb at uri is in illegal state: ' + mongoose.connection.readyState);
                break;
        }

        mongoose.connection.once('open', function() {
            log.info('Connected to mongodb: ' + sanitizeURI(uri));
        });

        mongoose.connection.on('error', function() {
            log.error('Connection failed to mongodb: ' + sanitizeURI(uri));
        });
    };

    /**
     * This method observe the database connection status and invokes the callback
     * function upon a successful connection
     * @param callback callback function
     */
    this.onConnect = function(callback) {
        if (mongoose.connection.readyState === 1) {
            return callback();
        }

        mongoose.connection.once('open', function() {
            return callback();
        });
    };

    this.disconnect = function(callback) {
        mongoose.disconnect(function(){
            log.info('Disconnected from database');
            if (callback) { callback(); }
        });
    };

    /**
     * This method sanitize the input uri by masking username and password
     * @param uri uri to sanitize
     * @returns String sanitized uri
     */
    var sanitizeURI = function(uri) {
        if (!uri) { return null; }

        var parts = uri.split('@'),
            sanitizedURI = uri;
        if (parts.length === 2) {
            var subParts = parts[0].split('//');
            if (subParts.length === 2) {
                subParts[1] = '********:********';
            }
            sanitizedURI = [subParts.join('//'), parts[1]].join('@');
        }
        return sanitizedURI;
    };

}

module.exports = new Database();
