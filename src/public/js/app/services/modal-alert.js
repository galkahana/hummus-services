'use strict';
var angular = require('angular'),
    marked = require('marked')

require('../../../scss/modal-alert.scss');

/*
    options can be dropped.
    if not can have:
    
    marked : true/false, whether message is to go through markdown filter
    confirm: confirm button text. if dropped will use OK
    reject: reject button text. if dropped will use Cancel
    size: alert size. if dropped will use sm
*/

module.exports = angular.module('modal-alert.services', [
    require('angular-ui-bootstrap'),
    require('angular-animate')
])
    .factory('ModalAlert', ['$uibModal','$sce',
        function($uibModal,$sce) {
            function open(title,message,options,cb) {
                if(typeof options == 'function') {
                    // allow calling without options
                    cb = options;
                    options = {};
                }
                
                var modalInstance = $uibModal.open({
                    animation: true,
                    template: require('../../../templates/modal-alert.html'),
                    controller: 'modal-alert-controller',
                    size: options.size || 'md',
                    resolve: {
                        modalOptions:function() {
                            return {
                                title:title,
                                message:$sce.trustAsHtml(options.marked || (options.marked === undefined) ? marked(message):message),
                                confirm:options.confirm || 'OK',
                                reject:options.reject || 'Cancel'                                
                            };
                        }
                    }
                });

                modalInstance.result.then(function () {
                    cb(true);
                }, function () {
                    cb(false);
                });                
            }

            return {
                open:open   
            }
        }
    ])
    .controller('modal-alert-controller', ['$scope','$uibModalInstance','modalOptions',
        function($scope, $uibModalInstance,modalOptions) {
            $scope.modalOptions = modalOptions;
            
            $scope.ok = function () {
                $uibModalInstance.close();
            };

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };            
        }
    ]);
    