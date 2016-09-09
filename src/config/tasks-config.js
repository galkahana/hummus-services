var fs = require('fs'),
	async = require('async'),
	path = require('path'),
    database = require('./database'),
    settings = require('./settings');
    
/*
    A short version of index including only what's required to run a background job.
    which is like index but without routing setup
 */

function Configuration() {
    // db
    var db = function(dbURL,callback) {
        // connect to database
        database.dbInit(dbURL,callback);
    };    

    /**
     * Orchestrate the task configuration
     */
    this.config = function(onReady) {
        async.auto({
            settings: function(callback) {
                settings.load(callback);
            },
            db: ['settings',function(callback,results) {
                db(results.settings.dbURL,callback);
            }]
        }, 
        function(err) {
            if(onReady)
                onReady(err);  
        });
    };

    this.deconfig = function(onReady) {
        async.auto({
            db: [function(callback) {
                database.disconnect(callback);
            }]
        }, 
        function(err) {
            if(onReady)
                onReady(err);  
        });        
    }
}

module.exports = new Configuration();
