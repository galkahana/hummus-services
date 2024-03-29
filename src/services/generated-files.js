'use strict';

var generationFilesModel = require('../models/generated-files'),
    mongoose = require('mongoose'),
    localFiles = {};

function GeneratedFiles() {
}

/*
    Simple crud interface
*/
GeneratedFiles.prototype.getAll = function (callback) {
    generationFilesModel
        .find()
        .exec(callback);
};

GeneratedFiles.prototype.getAllIn = function (ids,callback) {
    generationFilesModel
        .find({_id:{$in:ids}})
        .exec(callback);
};

GeneratedFiles.prototype.findAll = function(queryParams,callback) {
    generationFilesModel
        .find(queryParams)
        .exec(callback); 
};

GeneratedFiles.prototype.findAllDesc = function(queryParams,callback) {
    generationFilesModel
        .find(queryParams)
        .sort({createdAt:-1})
        .exec(callback); 
};

GeneratedFiles.prototype.get = function (id, callback) {
    generationFilesModel
        .findOne({_id: id})
        .exec(function(err, fileEntry) {
            if (err) return callback(err);
            // add auxiliery data about local path wharabouts if local
            callback(null,fileEntry,fileEntry ? localFiles[fileEntry._id]:null);
        });

};

GeneratedFiles.prototype.getWithPublic = function (id, callback) {
    generationFilesModel
        .findOne({publicDownloadId: id})
        .exec(function(err, fileEntry) {
            if (err) return callback(err);
            // add auxiliery data about local path wharabouts if local
            callback(null,fileEntry,fileEntry ? localFiles[fileEntry._id]:null);
        });

};


GeneratedFiles.prototype.create = function (data, callback) {
    generationFilesModel
        .create(data, function(err,generatedFileEntry) {
            // when creating, register the local file reference, to optimize
            // download. This assumes that the party creating the entry
            // is also the one owning the local file
            if(err) return callback(err);
            
            localFiles[generatedFileEntry._id] = generatedFileEntry.localSource.data.path;
            
            callback(err,generatedFileEntry);
        });

};

GeneratedFiles.prototype.update = function (id, data, callback) {
    generationFilesModel
        .update({_id: id}, data, function(err) {
            if (err) { return callback(err); }
            generationFilesModel.
                findOne({_id: id})
                .exec(callback);
        });
};


GeneratedFiles.prototype.destroy = function(id, callback) {
    generationFilesModel
        .remove({_id: id})
        .exec(callback);
}

GeneratedFiles.prototype.destroyIn = function(ids,callback) {
    generationFilesModel
        .remove({ _id: { $in: ids } })
        .exec(callback);
}


module.exports = new GeneratedFiles();