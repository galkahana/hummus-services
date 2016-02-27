var logger = require('./logger'),
	jDocDocumentRendering = require('./json-document-rendering/document-rendering'),
    htmlDocumentRendering = require('./html-document-rendering'),
	externalFilesDownloader = require('./external-files-downloader'),
	FilesMap = require('./files-map'),
	fs = require('fs'),
	async = require('async'),
	path = require('path'),
	mustache = require('mustache'),
	tmp = require('temporary'),
	PDFWStreamForFile = require('hummus').PDFWStreamForFile;


var localResourcesPath = path.resolve(__dirname,'../local-resources/');

// production modules
function downloadExternals(jobDescriptor,callback) {
	externalFilesDownloader.downloadExternals(jobDescriptor.externals,callback);
}

function getDocument(jobDescriptor,callback,results) {
	if(jobDescriptor.document.embedded)
		return callback(null,jobDescriptor.document.embedded)
	
    if(jobDescriptor.document.path || jobDescriptor.document.external) {
        var filesMap = new FilesMap(localResourcesPath,results.download_externals);
        var filePath = filesMap.getItemFilePath(jobDescriptor.document);
        
        if(filePath) {
            fs.readFile(filePath,'utf8',function(err,data) {
                if(err) return callback(err);
                callback(null,data);
            });
        } else {
            callback(null,null);
        }
    }
    else
        callback(null,null); // not embedded, path or external. So engine specific and will be taken care of by engine								
}
	
function computeDocument(jobDescriptor,callback,results) {
    if(!results.get_document)
        return callback(null,null); // if didn't get document not need to compute. move on

    // end result changes per engine. some want JSON, some want string
    var toResult = getEngine(jobDescriptor).name == 'JDocToPDF' ? 
                        function(value){return typeof value == "string" ? JSON.parse(value):value;} :
                        function(value){return typeof value == "string" ? value:JSON.stringify(value);};
    
	if(jobDescriptor.variableData) {
		// document must be string data!
		// use mustache to resolve, and return document
        
        // if document is embedded object, try to convert to string
        var theDocumentString = typeof results.get_document == "string" ? results.get_document: JSON.stringify(results.get_document)
        callback(null,toResult(mustache.render(theDocumentString,jobDescriptor.variableData)));
	} else {
		if(jobDescriptor.document.embedded) {
			// already a document, no need to parse
			callback(null,toResult(results.get_document));
		} else {
			callback(null,toResult(results.get_document));
		}
	}
}

function renderJDocToPDF(jobDescriptor,callback,results) {
	var options = 	{ 
					pwd:path.resolve(localResourcesPath),
					pdfWriter: jobDescriptor.document.engine ? jobDescriptor.document.engine.options:null
				},
		resultPath = new tmp.File().path,
		outputStream = new PDFWStreamForFile(resultPath);								
	
	jDocDocumentRendering.render(
		results.compute_document,
		results.download_externals,
		outputStream,
		options,
		function(err) {
			outputStream.close(function(){
				callback(err,resultPath);
			});
		}
	);	    
}

function renderHTMLToPDF(jobDescriptor,callback,results) {
    htmlDocumentRendering.render(
        jobDescriptor.document.link ? {link:jobDescriptor.document.link} : {raw:results.compute_document},
        jobDescriptor.document.engine.options,
        callback
    );
}

function getEngine(jobDescriptor) {
    return  jobDescriptor.document.engine || {name:'JDocToPDF'};
}

function generatePDF(jobDescriptor,callback,results) {
    var engine = getEngine(jobDescriptor);

    switch(engine.name) {
        case 'JDocToPDF': {
            renderJDocToPDF(jobDescriptor,callback,results);
            break;
        }
        case 'HTMLToPDF': {
            renderHTMLToPDF(jobDescriptor,callback,results);
            break;
        }
        default: {
            callback(new Error('Unknown PDF Engine: ' + engine.name),null);
        }
    }    
}

function cleanup(callback,results) {
	externalFilesDownloader.cleanExternals(results.download_externals);
	callback();
}

function runTicket(inTicket,cb) {
	async.auto(
		{
			download_externals: function(callback) {
				downloadExternals(inTicket,callback);
			},
			get_document: ['download_externals',function(callback,results) {
				getDocument(inTicket,callback,results);
			}],
			compute_document: ['get_document',function(callback,results) {
				computeDocument(inTicket,callback,results);
			}],
			generate_pdf : ['download_externals','compute_document', function(callback,results) {
				generatePDF(inTicket,callback,results);
			}],
			cleanup : ['download_externals','generate_pdf', cleanup]
		},
		function(err,results) {
			if(err) {
                logger.error('Got error running job ticket',err);
                return cb(err);
            }
			
			cb(null,{outputPath:results.generate_pdf,outputTitle:inTicket.title});
		}
	);
}

module.exports = {
	run:runTicket
};