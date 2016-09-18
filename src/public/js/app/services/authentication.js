'use strict';


var angular = require('angular');

var HUMMUS_SERVICES_ACCESS_TOKEN = 'hummus-services-access-token';

module.exports = angular.module('authentication.services', [
    require('angular-cookies'),
    require('./users').name,
    require('./authentication-interceptor').name,
    require('./tokens').name
])
.factory('authentication', ['$cookies','$interval','$rootScope','Users','AuthenticationInterceptor','Token',
  function($cookies,$interval,$rootScope,Users,AuthenticationInterceptor,Token) {
      
        var localAuth = null;
    
        var TWO_MINS = 1000 * 60 * 2;
    
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
        
        var intervalPromise = null;
        
        function updateSiteToken() {
            Token.updateSiteToken().then(function(response) {
                saveToken(response.data.accessToken);                       
            }, function(err) {
                clearToken();
                stopUpdateInterval();
            });            
        }
        
        function startUpdateInterval() {
            if(!intervalPromise)
                intervalPromise = $interval(updateSiteToken, TWO_MINS);
            
        }
        
        function stopUpdateInterval() {
            if(intervalPromise) {
                $interval.cancel(intervalPromise);
                intervalPromise = null;
            }
        }
        
        function restartUpdateInterval() {
            stopUpdateInterval();
            startUpdateInterval();
        }
      
        $rootScope.$on('destroy',function() {
            stopUpdateInterval();
        });
      
    return {
        hasToken: function() {
            return !!localAuth || !!$cookies.get(HUMMUS_SERVICES_ACCESS_TOKEN);
        },
        getToken: function() {
            return localAuth || $cookies.get(HUMMUS_SERVICES_ACCESS_TOKEN);
        },
        autoLoginDone: function() {
            restartUpdateInterval();
        },
        login: function(credentials,cb) {
            Users.login(credentials)
                    .then(function(response) {
                        saveToken(response.data.accessToken);
                        restartUpdateInterval();
                        cb(null);
                    }, cb);           
        },
        signup: function(data,options,cb) {
            Users.signup(data,options)
                    .then(function(response) {
                        saveToken(response.data.accessToken);
                        restartUpdateInterval();
                        cb(null);
                    }, cb);           
            
        },
        logout: function(cb) {
            Users.logout()
                    .then(function(response) {
                        clearToken();
                        stopUpdateInterval();
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