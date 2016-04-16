'use strict';


var angular = require('angular');
var lodash = require('lodash');

var accessCreds = {
    client: {
        id: 'console',
        secret: 'console.key.112'
    }
}

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
                },
                login: function(credentials) {
                    return Restangular.all('authenticate').customPOST(_.extend(credentials,
                            {
                                clientId: accessCreds.client.id,
                                clientSecret: accessCreds.client.secret
                            }
                        ),'sign-in');
                },
                logout: function() {
                    return Restangular.all('authenticate').customDELETE('sign-out');
                }
            };
        }
    ]);