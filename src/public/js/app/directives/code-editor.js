'use strict';

var angular = require('angular');

require('../../../scss/code-editor.scss');


var CodeMirror = require('codemirror');

// code mirror css
require('codemirror/lib/codemirror.css')
// javascript mode
require('codemirror/mode/javascript/javascript.js')

module.exports = angular.module('code-editor.directives',[])
    .directive('codeEditor', ['$timeout',
       function($timeout) {
           return {
             restrict: 'E',
             scope: {
                 init:'=',
                 code:'='
             },
             template: require('../../../templates/code-editor.html'),
             link:function(scope,element) {
                 var myCodeMirror = CodeMirror(function(elt) {
                          element[0].appendChild(elt);
                        }, {
                        value: scope.init,
                        mode:  "javascript",
                        lineNumbers:true
                    });
                    
                myCodeMirror.on('changes',function() {
                    $timeout(function() {
                        scope.code = myCodeMirror.getValue();
                    });
                })
                
                scope.$watch('init', function(value) {
                    myCodeMirror.setValue(value);     
                });
             }  
           };
       } 
    ]);