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
            var usersActions = Restangular.service('users/actions');


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
                },
                signup: function(data,options) {
                    return Restangular.all('authenticate').customPOST(_.extend(data,
                            {
                                clientId: accessCreds.client.id,
                                clientSecret: accessCreds.client.secret
                            }
                        ),'sign-up',null,{hmscpa:options.capcha});
                },                
                updateUsername: function(username) {
                    return usersActions.post({type:'changeUsername',username:username});
                },
                updatePassword: function(oldPassword,newPassword) {
                    return usersActions.post({type:'changePassword',oldPassword:oldPassword,newPassword:newPassword});
                },
                getPlanUsageData: function(toDate) {
                    return users.one('me').customGET('plan-usage',{to:toDate});
                }
            };
        }
    ]);