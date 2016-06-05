'use strict';


var angular = require('angular');

module.exports = angular.module('accounting.services', [
    require('imports?angular=angular&_=lodash!exports?"restangular"!restangular')
])
    .config(require('../config/restangular').defaultRestangular)
    .factory('Accounting', ['Restangular',
        function(Restangular) {
            var publicAccounting = Restangular.service('public/accounting');

            return {
                getTotalJobs: function() {
                    return publicAccounting.one('ran').get();
                }
            };
        }
    ]);