'use strict';

require('../../../scss/home-page.scss');

var moment = require('moment'),
    hummusService = require('exports?hummusService!../../lib/hummus/hummusservice');

homeController.$inject = ['$scope','$filter','authentication'];

function homeController($scope,$filter,authentication) {

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
    
    // default value with default ticket
    $scope.ticket = $filter('prettyStringify')(kDefaultJobTicket);

    $scope.submitTicket = function() {
        // use hummus service to generate the document described in txtJobTicket ($('#txtJobTicket').val())
        // using the local service ('.')
        // when done open it (function(url){window.open(url);})

        hummusService.generatePDFDocument(
            '__apiURL__',
            authentication.getToken(),
            $('#txtJobTicket').val(),
            function(url){
                window.open(url);
            },
            function(){
                alert('Error in creating PDF file');
            });        
    }

}

module.exports = homeController;