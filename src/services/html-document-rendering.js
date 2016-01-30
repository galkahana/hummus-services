/*
    function render(inHTMLData, inOptions, inCallback)
    
    inHTMLData - input HTML source data. dict:
        {
            link:"web page URL"
            OR
            raw:"HTML string"
        }
        
    inOptions - engine production options
        {
            pageWidth:PAGE_WIDTH_IN_POINTS,
            pageHeight:PAGE_HEIGHT_IN_POINTS
            refURL: for raw html, set the base url
        }
        
    inCallback(err,resultPath) - callback. resultPath is a file path for the end result PDF
*/  

var phantom = require('phantom'),
	tmp = require('temporary'),
    logger = require('./logger');

var phantomInstance  = null;

function getPhantomInstance(cb) {
    if(phantomInstance) {
        cb(phantomInstance);
    } else {
        logger.log('Creating PhantomJS instance');
        phantom.create('--web-security=no',function (ph) {
            logger.log('Created PhantomJS instance');
            phantomInstance = ph;
            cb(ph);
        });
    }
}

function render(page,cb) {
    var newPath = new tmp.File().path;
    page.render(newPath, {format: 'pdf'} ,function() {
        logger.log('Rendered web page to',newPath);
        page.close();
        cb(null,newPath);
    });
}

function pointsToPhantomMeasure(inPoints) {
    return '' + ((inPoints)/72.0) + 'in';
}

module.exports.render = function(inHTMLData,inOptions,inCallback) {
    getPhantomInstance(function(ph) {
        ph.createPage(function (page) {
            page.set('paperSize', 
                       {
                            width : pointsToPhantomMeasure(inOptions.pageWidth || 595),
                            height : pointsToPhantomMeasure(inOptions.pageHeight || 842)
                        }, function() {
                            if(inHTMLData.link) {
                                // url link
                                logger.log('PhantomJS opening',inHTMLData.link);
                                page.open(inHTMLData.link, function (status) {
                                    if(status == 'success') {
                                        logger.log('Success in opening webpage',inHTMLData.link);
                                        render(page,inCallback);
                                    }
                                    else {
                                        logger.error('Error in opening webpage',inHTMLData.link);
                                        inCallback(new Error('unable to open ' + inHTMLData.link))
                                    }
                                });
                            } else {
                                // html string
                                logger.log('PhantomJS setting html content',inHTMLData.raw);
                                page.set('onLoadFinished', function(success) {
                                    logger.log('Load finished');
                                    render(page,inCallback);
                                });
                                page.set('url',inOptions.refURL || 'about:blank');
                                page.set('content',inHTMLData.raw);
                            }
                        });
        });
  });
}

process.on('exit', function(code, signal) {
    if(phantomInstance) {
        logger.log('Exiting PhantomJS module');
        phantomInstance.exit();
        phantomInstance = null;
    }
});