'use strict';

var _ = require('lodash');

loginSetup.$inject = ['$rootScope', '$state', '$stateParams', 'authorization', 'principal'];
function loginSetup($rootScope, $state, $stateParams, authorization, principal) {
      $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
          
        $rootScope.toState = toState;
        $rootScope.toStateParams = toStateParams;
          
        if(_.startsWith(toState.name,'console.') && principal.isIdentityResolved()) 
            authorization.authorize();
      });
}
    
module.exports = loginSetup;