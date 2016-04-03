'use strict';

var generationJobModel = require('../models/generation-jobs'),
    mongoose = require('mongoose');

function GenerationJobs() {
}

/*
    Simple crud interface
*/
GenerationJobs.prototype.getAll = function (callback) {
    generationJobModel
        .find()
        .lean()
        .exec(callback);
};

GenerationJobs.prototype.findAll = function(queryParams,callback) {
    generationJobModel
        .find(queryParams)
        .sort({createdAt:-1})
        .lean()
        .exec(callback); 
};

GenerationJobs.prototype.get = function (id, callback) {
    generationJobModel
        .findOne({_id: id})
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


GenerationJobs.prototype.destroy = function(id, callback) {
    generationJobModel
        .remove({_id: id})
        .exec(callback);
}


module.exports = new GenerationJobs();