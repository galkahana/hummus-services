'use strict';


var angular = require('angular');

module.exports = angular.module('authentication-interceptor.services', [
    require('angular-cookies')
])
.factory('AuthenticationInterceptor', ['$q', '$cookies','$location',
        function($q, $cookies,$location) {
            return {
                request: function(config) {
                    var accessToken = $cookies.get('hummus-services-access-token');
                    if (accessToken) {
                        config.headers.Authorization = 'Bearer ' + accessToken;
                    }
                    return config || $q.when(config);
                },
                responseError: function(rejection) {
                    if (rejection.status == 401) {
                        $location.path('/login');
                    }
                    return $q.reject(rejection);
                }
            };
        }
    ]);