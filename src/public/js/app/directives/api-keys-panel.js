'use strict';

var angular = require('angular'),
    toastr = require('toastr');
        
require('toastr/build/toastr.css');
require('../../../scss/api-keys-panel.scss');

module.exports = angular.module('api-keys-panel.directives',[
    require('../services/constants').name,
    require('../services/tokens').name
])
    .directive('apiKeysPanel', ['Constants','Token',
       function(Constants,Token) {
           return {
             restrict: 'E',
             scope: {
             },
             template: require('../../../templates/api-keys-panel.html'),
             link: function(scope) {
                 
                 function loadData() {
                     Token.get().then(function(response) {
                         var result = response.data;
                         scope.publicKey = result.public;
                         scope.privateKey = result.private;
                     },function(err) {
                         console.log(err);
                         toastr.error('Failed to fetch api keys');
                     })
                 }
                 
                 loadData();
                 
                 
                 scope.createPublicKey = function() {
                     scope.creatingPublic = true;
                     Token.createKey(Constants.eTokenRolePublicAPI).then(function(response) {
                         scope.creatingPublic = false;
                         scope.publicKey = response.data.accessToken;                         
                     }, function(err) {
                         scope.creatingPublic = false;
                         console.log(err);
                         toastr.error('Failed create API key');                         
                     });
                 }

                 scope.deletePublicKey = function() {
                     scope.deletingPublic = true;
                     Token.revokeKey(Constants.eTokenRolePublicAPI).then(function(response) {
                         scope.deletingPublic = false;
                         scope.publicKey = null;                         
                     }, function(err) {
                         scope.deletingPublic = false;
                         console.log(err);
                         toastr.error('Failed revoke API key');                         
                     });
                 }

                 scope.createPrivateKey = function() {
                     scope.creatingPrivate = true;
                     Token.createKey(Constants.eTokenRolePrivateAPI).then(function(response) {
                         scope.creatingPrivate = false;
                         scope.privateKey = response.data.accessToken;                         
                     }, function(err) {
                         scope.creatingPrivate = false;
                         console.log(err);
                         toastr.error('Failed create API key');                         
                     });
                 }

                 scope.deletePrivateKey = function() {
                     scope.deletingPrivate = true;
                     Token.revokeKey(Constants.eTokenRolePrivateAPI).then(function(response) {
                         scope.deletingPrivate = false;
                         scope.privateKey = null;                         
                     }, function(err) {
                         scope.deletingPrivate = false;
                         console.log(err);
                         toastr.error('Failed revoke API key');                         
                     });
                 }

             }
           };
       } 
    ]);