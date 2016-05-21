'use strict';


var angular = require('angular');

var HUMMUS_SERVICES_ACCESS_TOKEN = 'hummus-services-access-token';

module.exports = angular.module('authentication.services', [
    require('angular-cookies'),
    require('./users').name,
    require('./authentication-interceptor').name
])
.factory('authentication', ['$cookies','Users','AuthenticationInterceptor',
  function($cookies,Users,AuthenticationInterceptor) {
      
        var localAuth = null;
    
        function clearToken() {
            $cookies.put(HUMMUS_SERVICES_ACCESS_TOKEN,'');
            $cookies.remove(HUMMUS_SERVICES_ACCESS_TOKEN);  
            localAuth = null;    
            AuthenticationInterceptor.clearToken();      
        }
        
        function saveToken(inToken) {
            $cookies.put(HUMMUS_SERVICES_ACCESS_TOKEN,inToken);            
            localAuth = inToken;          
            AuthenticationInterceptor.setToken(inToken);
        }
      
      
    return {
        hasToken: function() {
            return !!localAuth || !!$cookies.get(HUMMUS_SERVICES_ACCESS_TOKEN);
        },
        getToken: function() {
            return localAuth || $cookies.get(HUMMUS_SERVICES_ACCESS_TOKEN);
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
        },
        idUrl: function(url) {
            var accessToken = localAuth || $cookies.get(HUMMUS_SERVICES_ACCESS_TOKEN);
            return url + (accessToken ? ('?b=' + accessToken):'');
        }        
    };
  }
])