'use strict';


var angular = require('angular');

module.exports = angular.module('authorization.services', [
])
.factory('authorization', ['$rootScope', '$state', 'principal',
  function($rootScope, $state, principal) {
    return {
      authorize: function() {
        
        $rootScope.$broadcast('authorization.authorizationStarts');
        
        return principal.identity()
          .then(function() {


            $rootScope.$broadcast('authorization.authorizationEnds');
              
            var isAuthenticated = principal.isAuthenticated();

              // i don't really have authorization yet. 
              if (isAuthenticated) {
                if ($rootScope.toState.data && $rootScope.toState.data.roles && $rootScope.toState.data.roles.length > 0 && !principal.isInAnyRole($rootScope.toState.data.roles)) {
                    $state.go('accessdenied'); // TBD
                }
                else {
                    // can continue...authenticated and authorized
                }
              } 
              else {
                $rootScope.returnToState = $rootScope.toState;
                $rootScope.returnToStateParams = $rootScope.toStateParams;
                $state.go('login');
              }


          });
      }
    };
  }
])