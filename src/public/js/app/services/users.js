'use strict';


var angular = require('angular');

module.exports = angular.module('users.services', [
    require('imports?angular=angular&_=lodash!exports?"restangular"!restangular')
])
    .config(require('../config/restangular').defaultRestangular)
    .factory('Users', ['Restangular',
        function(Restangular) {
            var users = Restangular.service('users');

            return {
                me: function() {
                    return users.one('me').get();
                }
            };
        }
    ]);