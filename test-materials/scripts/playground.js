var logger = require('../../src/services/logger'),
	documentRendering = require('../../src/services/json-document-rendering/document-rendering'),
	externalFilesDownloader = require('../../src/services/external-files-downloader'),
	FilesMap = require('../../src/services/files-map'),
	fs = require('fs'),
	async = require('async'),
	path = require('path'),
	mustache = require('mustache'),
	PDFWStreamForFile = require('hummus').PDFWStreamForFile;


// product modules
function downloadExternals(jobDescriptor,callback) {
	externalFilesDownloader.downloadExternals(jobDescriptor.externals,callback);
}

function getDocument(jobDescriptor,callback,results) {
	if(jobDescriptor.document.embedded)
		return callback(null,jobDescriptor.document.embedded)
	
	var filesMap = new FilesMap(path.resolve(__dirname,'../job-descriptors/'),results.download_externals);
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
					pwd:path.resolve(__dirname,'../job-descriptors/'),
					pdfWriter: {
						log:path.resolve(__dirname,'../output/' + inDocFileName + '.log')
					} 
				},
	outputStream = new PDFWStreamForFile(path.resolve(__dirname, '../output/' + inDocFileName  + '.pdf'));								
	
	documentRendering.render(
		results.compute_document,
		results.download_externals,
		outputStream,
		options,
		function(err) {
			callback(err);
		}
	);								
}

function computeDocument(jobDescriptor,callback,results) {
	if(jobDescriptor.variableData) {
		// document must be string data!
		// use mustache to resolve, and return document
		callback(null,JSON.parse(mustache.render(results.get_document,jobDescriptor.variableData)));
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
	
logger.log('Starting Hummus Services');

async.each([
			'variableData',
			'reffing',
			'appending',
			'simple',
			'basicDocument',
			'elementsWithTop',
			'basicDocumentModification'
			],
			function(inDocFileName,cb)
			{
				fs.readFile(path.resolve(__dirname,'../job-descriptors/' + inDocFileName + '.json'), function (err, data) {
					if (err) return cb(err);
				
					var jobDescriptor = JSON.parse(data);

					async.auto(
						{
							download_externals: function(callback) {
								downloadExternals(jobDescriptor,callback);
							},
							get_document: ['download_externals',function(callback,results) {
								getDocument(jobDescriptor,callback,results);
							}],
							compute_document: ['get_document',function(callback,results) {
								computeDocument(jobDescriptor,callback,results);
							}],
							generate_pdf : ['download_externals','compute_document', function(callback,results) {
								generatePDF(inDocFileName,callback,results);
							}],
							cleanup : ['download_externals','generate_pdf', cleanup]
						},
						cb
					);
				});
			},
			function(err) {
				if(err) throw err;
				logger.log('Done Hummus Services');			
			});






