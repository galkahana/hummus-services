'use strict';

var generationJobModel = require('../models/generation-jobs'),
    mongoose = require('mongoose'),
    async = require('async'),
    _ = require('lodash'),
    generatedFilesService = require('./generated-files'),
    logger = require('./logger'),
    remoteStorageService = require('./remote-storage-service'),
    moment = require('moment');

function GenerationJobs() {
}

/*
    Simple crud interface
*/
GenerationJobs.prototype.getAll = function (callback) {
    generationJobModel
        .find()
        .exec(callback);
};

GenerationJobs.prototype.getAllIn = function (ids, callback) {
    generationJobModel
        .find({_id: {$in:ids}})
        .exec(callback);
};

GenerationJobs.prototype.findAll = function(queryParams,callback) {
    generationJobModel
        .find(queryParams)
        .exec(callback); 
};

GenerationJobs.prototype.findAllDesc = function(queryParams,callback) {
    generationJobModel
        .find(queryParams)
        .sort({createdAt:-1})
        .exec(callback); 
};

GenerationJobs.prototype.get = function (id, inOptions, callback) {
    if(typeof inOptions == 'function') {
        callback = inOptions;
        inOptions = null;
    }
    
    if(!inOptions) {
        inOptions = {};
    }
    
    var query = generationJobModel
        .findOne({_id: id});
        
        if(inOptions.populateGeneratedFile)
            query.populate('generatedFile')
        
        query
        .exec(callback);

};

GenerationJobs.prototype.create = function (data, callback) {
    generationJobModel
        .create(data, callback);

};

GenerationJobs.prototype.update = function (id, data, callback) {
    generationJobModel
        .update({_id: id}, data, function(err) {
            if (err) { return callback(err); }
            generationJobModel.
                findOne({_id: id})
                .exec(callback);
        });
};

GenerationJobs.prototype.updateIn = function (ids, fieldsToSet, callback) {
    generationJobModel
        .update(
            {_id: {$in:ids}}, 
            {$set: fieldsToSet},
            {multi: true})
        .exec(callback);
};

GenerationJobs.prototype.destroy = function(id, callback) {
    generationJobModel
        .remove({_id: id})
        .exec(callback);
};

GenerationJobs.prototype.destroyIn = function(ids,callback) {
    generationJobModel
        .remove({ _id: { $in: ids } })
        .exec(callback);
};

function deleteFilesForGeneratedFileIDs(generatedFilesIDs,callback) {
    /*
        Important! this one does not null gneerated file entries
    */
    generatedFilesService.getAllIn(generatedFilesIDs,function(err,items) {
        if(err)
            return callback(err);
        
        // remove files from remote storage
        remoteStorageService.removeFiles(
            _.filter(
                _.map(items,function(value){return value.remoteSource;}),
                function(value){return !!value;}),function(err) {
                    logger.info('Done Removing multiple files from remote storage');
                    
                    // remove generated files entries
                    generatedFilesService.destroyIn(generatedFilesIDs,callback);
                });
    });
}

function deleteFilesForJobIDsNoUpdate(self,items,callback) {
    var jobItems;
    
    async.series(
        [
            function(cb) {
                logger.info('Fetching job items for IDs');
                self.getAllIn(items,function(err, generationJobs){
                   if(err) {
                        logger.error('Error in fetching jobs for files delete',err);
                        return cb(err);
                   }
                   jobItems = generationJobs;
                   cb(); 
                });
            },
            function(cb) {
                logger.info('Deleting files for jobs');
                deleteFilesForGeneratedFileIDs(
                    _.filter(_.map(jobItems,function(value){return value.generatedFile;}),function(value){return !!value;}),
                    function(err) {
                        if(err) {
                            logger.error('Error in deleting files for jobs',err);
                        }
                        else 
                            logger.info('Succeeded Deleting files for jobs');
                        cb(err);
                    });
            }
        ],callback
    );       
}

GenerationJobs.prototype.deleteFilesForJobs = function(items,callback) {
    var self = this;

    async.series(
        [
            function(cb) {
                deleteFilesForJobIDsNoUpdate(self,items,cb);
            },
            function(cb) {
                logger.info('Updating jobs with null files');
                self.updateIn(items,
                    {generatedFile:null},
                    function(err) {
                        if(err) {
                            logger.error('Error in updating jobs',err);
                        }
                        else 
                            logger.info('Succeeded Updating multiple jobs by removing their files');
                        cb(err);
                    });
            }
        ],callback
    );    
};

GenerationJobs.prototype.deleteAllWithFiles = function(items,callback) {
    var self = this;
    async.series(
        [
            function(cb) {
                deleteFilesForJobIDsNoUpdate(self,items,cb);
            },
            function(cb) {
                logger.info('Deleting jobs');
                self.destroyIn(items,
                    function(err) {
                        if(err) {
                            logger.error('Error in deleting jobs',err);
                        }
                        else 
                            logger.info('Succeeded Deleting multiple jobs');
                        cb(err);
                    });
            }
        ],callback
    );
}

GenerationJobs.prototype.deleteTimedoutFiles = function(callback) {
    var self = this;
    var now = moment();
    logger.log('Starting Delete Timedout Files For Time',now.format());

    async.auto({
        findTimedOutFiles: function(cb){
            self.findAll({deleteFileAt:{$lte:now.toDate()}},function(err,jobs) {
                if(err)
                    return cb(err);
                cb(null,_.map(jobs,'_id'));
            });
        },
        deleteTimedOutFiles: ['findTimedOutFiles',function(cb,results) {
            if(results.findTimedOutFiles.length > 0) {
                logger.log('Deleting files that require deleting now for jobs',results.findTimedOutFiles);
                self.deleteFilesForJobs(results.findTimedOutFiles,cb);
            }
            else {
                logger.log('No jobs require their files to be deleted');
                cb(null,null);
            }
        }],
        removeDeleteTimeProperty: ['deleteTimedOutFiles',function(cb,results) {
            if(results.findTimedOutFiles.length > 0) {
                self.updateIn(results.findTimedOutFiles,{deleteFileAt:null},cb);
            }
            else {
                cb(null,null);
            }
        }]
    },
    function(err,results) {
        if(err)
        {
            logger.err('Finishing With Error',err);
        }
        logger.log('Finishing Delete Timedout Files');
        callback(err);
    });
};

module.exports = new GenerationJobs();