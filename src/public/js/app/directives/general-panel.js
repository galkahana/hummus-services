'use strict';

var angular = require('angular'),
    toastr = require('toastr');
        
require('toastr/build/toastr.css');
require('../../../scss/general-panel.scss');

module.exports = angular.module('general-panel.directives',[
    require('../services/users').name,
    require('../services/principal').name
])
    .directive('generalPanel', ['Users','principal',
       function(Users,principal) {
           return {
             restrict: 'E',
             scope: {
             },
             template: require('../../../templates/general-panel.html'),
             link: function(scope) {
                 
                 function loadData() {
                     Users.me().then(function(response) {
                         scope.me = response.data;
                     },function(err) {
                         console.log(err);
                         toastr.error('Failed to get user data');
                     })
                 }
                 
                 loadData();
                 
                 scope.updateProfile = function() {
                     scope.waitingForProfileComplete = true;
                     scope.me.put().then(function(){
                         scope.waitingForProfileComplete = false;
                         // update relevant principal fields
                         principal.identity().then(function(value){
                             value.name = scope.me.name;
                             value.email = scope.me.email;
                         });
                        toastr.success('Update is successfull');
                     },function(err) {
                         scope.waitingForProfileComplete = false;
                         console.log(err);
                         toastr.error('Failed to update user data');
                     });
                 };
                 
                 
                 scope.updateUsername = function() {
                     scope.waitingForUsernameComplete = true;
                     Users.updateUsername(scope.me.username).then(function(){
                         scope.waitingForUsernameComplete = false;
                         // update relevant principal fields
                         principal.identity().then(function(value){
                             value.username = scope.me.username;
                         });
                        toastr.success('Username changed successfully');
                     },function(err) {
                         scope.waitingForUsernameComplete = false;
                         console.log(err);
                         var responseData = err.data;
                         if(responseData && responseData.info && responseData.info.duplicateUsername)
                            toastr.error('username ' + scope.me.username + ' is already occupied',{closeButton:true});
                         else
                            toastr.error('Failed to update username');
                     });                     
                 };
                 
                 
                 scope.updatePassword = function() {
                     if(scope.newPassword !== scope.repeatNewPassword) {
                         scope.errorRepeatDoesNotMatch = true;
                         return;
                     } else {
                         scope.errorRepeatDoesNotMatch = false;
                     }
                     
                     
                     scope.waitingForPasswordComplete = true;
                     Users.updatePassword(scope.oldPassword,scope.newPassword).then(function(){
                         scope.waitingForPasswordComplete = false;
                        toastr.success('Password changed successfully');
                     },function(err) {
                         scope.waitingForPasswordComplete = false;
                         console.log(err);
                         var responseData = err.data;
                         if(responseData && responseData.info && responseData.info.oldPasswordMismatch)
                            toastr.error('Old password didn\'t match current account password',{closeButton:true});
                         else
                            toastr.error('Failed to update password');
                     });                     
                 };                 
                 

             }
           };
       } 
    ]);