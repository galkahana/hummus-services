'use strict';

var generationFilesModel = require('../models/generated-files'),
    mongoose = require('mongoose');

function GeneratedFiles() {
}

/*
    Simple crud interface
*/
GeneratedFiles.prototype.getAll = function (callback) {
    generationFilesModel
        .find()
        .lean()
        .exec(callback);
};

GeneratedFiles.prototype.get = function (id, callback) {
    generationFilesModel
        .findOne({_id: id})
        .exec(callback);

};

GeneratedFiles.prototype.create = function (data, callback) {
    generationFilesModel
        .create(data, callback);

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


module.exports = new GeneratedFiles();