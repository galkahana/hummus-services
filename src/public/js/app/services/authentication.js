'use strict';


var angular = require('angular');

var HUMMUS_SERVICES_ACCESS_TOKEN = 'hummus-services-access-token';

module.exports = angular.module('authentication.services', [
    require('angular-cookies'),
    require('./users').name
])
.factory('authentication', ['$cookies','Users',
  function($cookies,Users) {
    
        function clearToken() {
            $cookies.put(HUMMUS_SERVICES_ACCESS_TOKEN,'');
            $cookies.remove(HUMMUS_SERVICES_ACCESS_TOKEN);            
        }
        
        function saveToken(inToken) {
            $cookies.put(HUMMUS_SERVICES_ACCESS_TOKEN,inToken);            
        }
      
      
    return {
        hasToken: function() {
            return !!$cookies.get(HUMMUS_SERVICES_ACCESS_TOKEN);
        },
        getToken: function() {
            return $cookies.get(HUMMUS_SERVICES_ACCESS_TOKEN);
        },
        login: function(credentials,cb) {
            Users.login(credentials)
                    .then(function(response) {
                        saveToken(response.data.accessToken);
                        cb(null);
                    }, cb);           
        },
        logout: function(cb) {
            Users.logout()
                    .then(function(response) {
                        clearToken();
                        cb(null);
                    }, cb);           
        }
    };
  }
])