'use strict';

var angular = require('angular');

require('../../../scss/pdf-preview.scss');

module.exports = angular.module('pdf-preview.directives',[])
    .directive('pdfPreview', [
       function() {
           return {
             restrict: 'E',
             scope: {
                 embed:'=',
                 download:'='
             },
             template: require('../../../templates/pdf-preview.html'),
             link:function(scope,element) {
                 
                 
                 scope.$watchGroup(['embed','download'],function() {
                     var pdfContainer = element[0].querySelector('.preview-container');
                     
                     if(scope.embed && scope.download) {
                         scope.hasContent = true;
                         
                         pdfContainer.innerHTML = 
                            '<object data="' + scope.embed + '" type="application/pdf">' +
                                'This browser does not support PDF preview. <a href="' + scope.download + '">download</a>' + 
                            '</object>';
                     }
                 })
             }  
           };
       } 
    ]);