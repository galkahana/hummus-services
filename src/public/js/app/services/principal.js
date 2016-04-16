'use strict';


var angular = require('angular');

module.exports = angular.module('principal.services', [
    require('./users').name,
    require('./authentication').name
])
.factory('principal', ['$q', '$http', '$timeout','$cookies','Users','authentication',
  function($q, $http, $timeout, $cookies,Users,authentication) {
    var _identity = undefined,
      _authenticated = false;

    return {
      isIdentityResolved: function() {
        return angular.isDefined(_identity);
      },
      isAuthenticated: function() {
        return _authenticated;
      },
      isInRole: function(role) {
        if (!_authenticated || !_identity.roles) return false;

        return _identity.roles.indexOf(role) != -1;
      },
      isInAnyRole: function(roles) {
        if (!_authenticated || !_identity.roles) return false;

        for (var i = 0; i < roles.length; i++) {
          if (this.isInRole(roles[i])) return true;
        }

        return false;
      },
      authenticate: function(identity) {
        _identity = identity;
        _authenticated = identity != null;
      },
      identity: function(force) {
        var deferred = $q.defer();

        if (force === true) _identity = undefined;

        // check and see if we have retrieved the identity data from the server. if we have, reuse it by immediately resolving
        if (angular.isDefined(_identity)) {
          deferred.resolve(_identity);

          return deferred.promise;
        }

        var self = this;
        if(authentication.hasToken()) {
            // attempt grabbing users data with cached info from previous session
            Users.me().then(function(response) {
                self.authenticate(response.data);
                deferred.resolve(_identity);
            },
            function(err) {
                // cant, cancel token and require authentication
                this.authenticate(null);
                deferred.resolve(_identity);
            });            
        }
        else {
            // null. require authentication
            self.authenticate(null);
            deferred.resolve(_identity);
        }

        return deferred.promise;
      }
    };
  }
])