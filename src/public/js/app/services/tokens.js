'use strict';


var angular = require('angular');

module.exports = angular.module('tokens.services', [
    require('imports?angular=angular&_=lodash!exports?"restangular"!restangular')
])
    .config(require('../config/restangular').defaultRestangular)
    .factory('Token', ['Restangular',
        function(Restangular) {
            var tokensActions = Restangular.service('tokens/actions');

            return {
                get: function(id) {
                    return Restangular.all('tokens').customGET();
                },
                createKey: function(type) {
                    return tokensActions.post({type:'create',tokenType:type});
                },
                revokeKey: function(type) {
                    return tokensActions.post({type:'revoke',tokenType:type});
                }
            };
        }
    ]);