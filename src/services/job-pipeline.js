var logger = require('./logger'),
	documentRendering = require('./json-document-rendering/document-rendering'),
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
	
function generatePDF(inDocFileName,callback,results) {
	var options = 	{ 
					pwd:path.resolve(localResourcesPath),
					pdfWriter: {}  // tbd on log
				},
		resultPath = new tmp.File().path,
		outputStream = new PDFWStreamForFile(resultPath);								
	
	documentRendering.render(
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

function computeDocument(jobDescriptor,callback,results) {
	if(jobDescriptor.variableData) {
		// document must be string data!
		// use mustache to resolve, and return document
        
        // if document is embedded object, try to convert to string
        var theDocumentString = typeof results.get_document == "string" ? results.get_document: JSON.stringify(results.get_document)
        callback(null,JSON.parse(mustache.render(theDocumentString,jobDescriptor.variableData)));
	} else {
		if(jobDescriptor.document.embedded) {
			// already a document, no need to parse
			callback(null,results.get_document);
		} else {
			callback(null,JSON.parse(results.get_document));
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
			if(err) return cb(err);
			
			cb(null,{outputPath:results.generate_pdf,outputTitle:inTicket.title});
		}
	);
}

module.exports = {
	run:runTicket
};