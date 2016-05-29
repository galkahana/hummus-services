'use strict';

require('../../../scss/public-base.scss');
require('../../../scss/login-page.scss'); 


loginController.$inject = ['$scope','$state','$rootScope','$cookies','principal','authentication'];

function loginController($scope,$state,$rootScope,$cookies,principal,authentication) {
    $scope.credentials = {};
    
    $scope.login = function(){
        
        $scope.$emit('loginController.loginStarts');
        authentication.login($scope.credentials,function(err){
            if(err) {
                $scope.$emit('loginController.loginEnds');
                console.log('login error');
                return;
            }
            
            // trigger principal load of identity
            principal.identity(true).then(function() {
                $scope.$emit('loginController.loginEnds');
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