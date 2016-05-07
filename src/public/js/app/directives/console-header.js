'use strict';

var angular = require('angular');

require('../../../scss/console-header.scss');

module.exports = angular.module('console-header.directives',[
    require('../services/principal').name,
    require('../services/authentication').name,
    require('./avatar').name
])
    .directive('consoleHeader', ['$state','principal','authentication',
       function($state,principal,authentication) {
           return {
             restrict: 'E',
             template: require('../../../templates/console-header.html'),
             link:function($scope) {
                $scope.me = principal.identity().then(function(value) {
                    $scope.me = value;
                });
                
                $scope.signOut = function() {
                    authentication.logout(function(err) {
                        if(err) {
                            console.log('logout error',err);
                            return;
                        }
                        
                        principal.authenticate(null);            
                        $state.go('public.welcome');
                    })
                }
             }  
           };
       } 
    ]);