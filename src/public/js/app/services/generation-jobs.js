'use strict';


var angular = require('angular');

module.exports = angular.module('generationjobs.services', [
    require('imports?angular=angular&_=lodash!exports?"restangular"!restangular')
])
    .config(require('../config/restangular').defaultRestangular)
    .factory('GenerationJob', ['Restangular',
        function(Restangular) {
            var generationJobs = Restangular.service('generation-jobs');

            return {
                get: function(id) {
                    return generationJobs.one(id).get();
                },
                query: function() {
                    return generationJobs.getList();
                }                
            };
        }
    ]);