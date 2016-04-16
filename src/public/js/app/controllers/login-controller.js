'use strict';

require('../../../scss/login-page.scss'); 


loginController.$inject = ['$scope','$state','$rootScope','$cookies','principal','authentication'];

function loginController($scope,$state,$rootScope,$cookies,principal,authentication) {
    $scope.credentials = {};
    
    $scope.login = function(){
        authentication.login($scope.credentials,function(err){
            if(err) {
                console.log('login error');
                return;
            }
            
            // trigger principal load of identity
            principal.identity(true).then(function() {
                // if needs to route, route
                if($rootScope.returnToState) {
                    $state.go($rootScope.returnToState,$rootScope.returnToStateParams);
                    // clear once implemented
                    $rootScope.returnToState = null;
                    $rootScope.returnToStateParams = null;                
                }
                else {
                    $state.go('console.home');
                }
            });            
        });
    }
}

module.exports = loginController;