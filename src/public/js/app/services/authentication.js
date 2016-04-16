'use strict';


var angular = require('angular');

module.exports = angular.module('authentication.services', [
    require('angular-cookies'),
    require('./users').name
])
.factory('authentication', ['$cookies','Users',
  function($cookies,Users) {
    
        function clearToken() {
            $cookies.put('hummusServicesAccessToken','');
            $cookies.remove('hummusServicesAccessToken');            
        }
        
        function saveToken(inToken) {
            $cookies.put('hummusServicesAccessToken',inToken);            
        }
      
      
    return {
        hasToken: function() {
            return $cookies.get('hummusServicesAccessToken');
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