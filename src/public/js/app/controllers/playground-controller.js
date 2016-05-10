'use strict';

require('angular-ui-layout/src/ui-layout.css');
require('../../../scss/playground-page.scss');

var moment = require('moment'),
    hummusService = require('exports?hummusService!../../lib/hummus/hummusservice');

playgroundController.$inject = ['$scope','$filter','authentication'];

function playgroundController($scope,$filter,authentication) {

    var kDefaultJobTicket = {
        "title": "Sample.pdf",
        "meta": {
            "label": "Sample Job " + moment().format('MMMM Do YYYY, h:mm:ss a')
        },
        "externals": {
                "fbLogo":"__websiteURL__/images/profileImage.jpg"
            },
        "document" : {
            "embedded" : {
                "pages": [
                    {
                        "width": 595,
                        "height": 842,
                        "boxes": [
                            {
                                "bottom": 500,
                                "left": 10,
                                "text": {
                                    "text": "hello world!",
                                    "options": {
                                        "fontPath": "./assets/arial.ttf",
                                        "size": 40,
                                        "color": "pink"
                                    }
                                }
                            },
                            {
                                "bottom": 600,
                                "left": 10,
                                "image": {"external":"fbLogo"}
                            }
                        ]
                    }
                ]
            }
        }
    };
    
    $scope.initTicket = $filter('prettyStringify')(kDefaultJobTicket);
    $scope.ticket = '';

    $scope.submitTicket = function() {
        $scope.waitingForComplete = true;
        $scope.downloadLink = null;
        $scope.embedLink = null;

        hummusService.generatePDFDocument(
            authentication.getToken(),
            $scope.ticket,
            function(urlDownload,urlEmbed){
                $scope.waitingForComplete = false;
                $scope.downloadLink = urlDownload;
                $scope.embedLink = urlEmbed;
                $scope.$apply();
            },
            function(){
                $scope.waitingForComplete = false;
                alert('Error in creating PDF file');
            });        
    }

}

module.exports = playgroundController;