var logger = require('../src/services/logger'),
	documentRendering = require('../src/services/json-document-rendering/document-rendering'),
	externalFilesDownloader = require('../src/services/external-files-downloader'),
	fs = require('fs'),
	async = require('async'),
	PDFWStreamForFile = require('hummus').PDFWStreamForFile;
	
	
logger.log('Starting Hummus Services');

async.each(['appending','simple','basicDocument','elementsWithTop','basicDocumentModification'],
			function(inDocFileName,cb)
			{
				fs.readFile('./' + inDocFileName + '.json', function (err, data) {
					if (err) throw err;
				
					var theDocument = JSON.parse(data), 
						options = {log:'./output/' + inDocFileName + '.log'},
						outputStream = new PDFWStreamForFile('./output/' + inDocFileName  + '.pdf');
				
					async.waterfall([
							function(callback) {
								externalFilesDownloader.downloadExternals(theDocument.externals,callback);
							},
							function(externals, callback) {
								documentRendering.render(
									theDocument,
									externals,
									outputStream,
									options,
									function(err) {
										callback(err,externals);
									}
								);
							},
							function(externals,callback) {
								externalFilesDownloader.cleanExternals(externals);
								callback();
							}
						], 
						function (err) {
							cb(err);
						});		
				});
			}, 
			function(err) {
				if(err) throw err;
				logger.log('Done Hummus Services');			
			});




