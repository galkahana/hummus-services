var $ = require('jquery'),
    hummusService = require('exports?hummusService!../lib/hummus/hummusservice');

require('bootstrap-webpack');
require('../../scss/pdfrendering.css');

$(document).ready(function(){
    var defaultJobTicket = {
        "title": "Sample.pdf",
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

    $('#txtJobTicket').val(JSON.stringify(defaultJobTicket,null,'\t'));


    $('#btnGenerate').click(function()
    {
        // use hummus service to generate the document described in txtJobTicket ($('#txtJobTicket').val())
        // using the local service ('.')
        // when done open it (function(url){window.open(url);})

        hummusService.generatePDFDocument(
            '__apiURL__',
            $('#txtJobTicket').val(),
            function(url){
                window.open(url);
            },
            function(){
                alert('Error in creating PDF file');
            });
    });
});