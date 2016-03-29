'use strict';


var angular = require('angular');

module.exports = angular.module('generated-files.services', [
    require('imports?angular=angular&_=lodash!exports?"restangular"!restangular')
])
    .config(require('../config/restangular').defaultRestangular)
    .factory('GeneratedFiles', ['Restangular',
        function(Restangular) {
            var generatedFiles = Restangular.service('generated-files');

            return {
                delete: function(id) {
                    return generatedFiles.one(id).remove();
                }
            };
        }
    ]);