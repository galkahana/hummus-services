'use strict';


var angular = require('angular');

module.exports = angular.module('generationjobs.services', [
    require('imports?angular=angular&_=lodash!exports?"restangular"!restangular')
])
    .config(require('../config/restangular').defaultRestangular)
    .factory('GenerationJob', ['Restangular',
        function(Restangular) {
            var generationJobs = Restangular.service('generation-jobs');
            var generationJobsActions = Restangular.service('generation-jobs/actions');

            return {
                get: function(id) {
                    return generationJobs.one(id).get();
                },
                query: function(params) {
                    return generationJobs.getList(params);
                },
                deleteMultiple: function(items) {
                    return generationJobsActions.post({type:'deleteAll',items:items});
                },
                deleteMultipleFiles: function(items) {
                    return generationJobsActions.post({type:'deleteFiles',items:items});
                    
                }             
            };
        }
    ]);