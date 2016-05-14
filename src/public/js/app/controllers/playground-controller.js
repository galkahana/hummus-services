'use strict';

require('angular-ui-layout/src/ui-layout.css');
require('../../../scss/playground-page.scss');

var moment = require('moment'),
    hummusService = require('exports?hummusService!../../lib/hummus/hummusservice');

playgroundController.$inject = ['$scope','$filter','authentication','Token'];

function playgroundController($scope,$filter,authentication,Token) {

    function loadData() {
        Token.get().then(function(response) {
            var result = response.data;
            $scope.publicKey = result.public;
            $scope.privateKey = result.private;
        });
    }
    
    loadData();

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
                                        "fontSource": {"name":"arial","origin":"local"},
                                        "size": 40,
                                        "color": "pink"
                                    }
                                }
                            },
                            {
                                "bottom": 600,
                                "left": 10,
                                "image": {"source":"fbLogo"}
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