var hummus = require('hummus'),
	bidi = require('icu-bidi'),
	_ = require('lodash'),
    async = require('async'),
	logger = require('../logger'),
	NewPageDriver = require('./new-page-driver'),
	ModifiedPageDriver = require('./modified-page-driver'),
	StreamObjectComposer = require('./stream-object-composer'),
	DocumentBoxMap = require('./document-box-map'),
	FilesMap = require('../files-map'),
	Measurements = require('./measurements'),
	TextUtilities = require('./text-utilities'),
	PDFCopyingContexts = require('./pdf-copying-contexts');

/*
	PDF rendering method.
	
	inDocument - Document object, describing the document structure and content
	inExternals - External file references mapping to local files
	inTargetStream - Target stream to write PDF file content to
	inOptions - generation options :
		{
			pwd: XXXXXX
			pdfWriter: {
				.....
			}
		}
		
		pwd is quite important, it is the base for all local resources
		pdfWriter is an object with options specific to the hummus module. they are the options provided to pdfWriter on creation.
			for example, you can setup a log file for the pdf generation via a log entry.
	inCallback - callback to call when done (not commiting here on async, but that's the way to be notified about the end)
*/
module.exports.render = function(inDocument,inExternals,inTargetStream,inOptions,inCallback) {
	var modifiedFileStream;
	
	var renderingHelpers = {};

	// prepare rendering helpers in a convenient structure
	renderingHelpers.documentBoxMap = new DocumentBoxMap(inDocument);
	renderingHelpers.filesMap = new FilesMap(inOptions.pwd,inExternals);
	renderingHelpers.measurements = new Measurements(renderingHelpers.documentBoxMap,renderingHelpers.filesMap);

	try
	{
		var writer;
		var pdfWriterOptions = inOptions ? inOptions.pdfWriter : undefined;

		if(inDocument.source)
		{
			modifiedFileStream = new hummus.PDFRStreamForFile(renderingHelpers.filesMap.get(inDocument.source));
			writer = hummus.createWriterToModify(modifiedFileStream,inTargetStream,pdfWriterOptions);
		}
		else
			writer = hummus.createWriter(inTargetStream,pdfWriterOptions);

		// one more for the helpers
		renderingHelpers.pdfCopyingContexts = new PDFCopyingContexts(writer);

		renderDocument(inDocument,writer,renderingHelpers,function(err) {
            if(!err)
                writer.end();	
            inCallback(err);
            
        });
	}
	catch(err)
	{
        logger.error('error in PDF generation',err);
		inCallback(err);
	}
}

function renderDocument(inDocument,inPDFWriter,inRenderingHelpers,callback)
{
	var accumulatedDims = {
		width:null,
		height:null
	}
	
	// render pages
    async.eachSeries(inDocument.pages,
        function(inPage,cb)
        {
            if(inPage.appendedFrom) {
                appendPage(inPage.appendedFrom,inPDFWriter,inRenderingHelpers,cb);
            } else {
                createPage(inPage,accumulatedDims,inPDFWriter,inRenderingHelpers,cb);
            }
        },
        callback);
}

function appendPage(inPageAppendData,inPDFWriter,inRenderingHelpers,cb) {
   	var originPath = inRenderingHelpers.filesMap.get(inPageAppendData.source);
    if(!originPath) {
        return cb(new Error('No source path defined for appending pages'));
    } 
    
	var originType = inPDFWriter.getImageType(originPath);
	var allPages = (typeof inPageAppendData.index === 'undefined' || inPageAppendData.index == 'all') ;
	var startIndex = allPages ?  0:inPageAppendData.index;
	var endIndex;
	
	/*
		Allow appending pages of PDF files or of TIFF images
	*/
	if(originType === 'PDF') {
		var copyContext = inRenderingHelpers.pdfCopyingContexts.getContext(originPath);
		if(!copyContext) {
            return cb(new Error('Unable to create copying context for appended page'),inPageAppendData);
        }
        endIndex = allPages ? 
				(copyContext.getSourceDocumentParser().getPagesCount() - 1) : 
						((typeof inPageAppendData.endIndex === 'undefined') ?  startIndex:inPageAppendData.endIndex);
		var result = 1;
        for(var i=startIndex;i<=endIndex && !!result;++i) {
			result = copyContext.appendPDFPageFromPDF(i);
        }
        if(!result) {
            return cb(new Error('failed to append page from'),inPageAppendData);
        }
	} 
	else if(originType == 'TIFF') 
	{
		endIndex = allPages ? 
				(inPDFWriter.getImagePagesCount(originPath)- 1) : 
						((typeof inPageAppendData.endIndex === 'undefined') ?  startIndex:inPageAppendData.endIndex);
						
		for(var i=startIndex;i<=endIndex;++i) {
			var imageDimensions = inPDFWriter.getImageDimensions(originPath,i);
			var pdfPage = inPDFWriter.createPage(0,0,imageDimensions.width,imageDimensions.height);
			var cxt = inPDFWriter.startPageContentContext(pdfPage);
			cxt.drawImage(0,0,originPath);
			inPDFWriter.writePage(pdfPage); // this one here throws exception on error, so we should be fine
		}
	}
    else {
        return cb(new Error('Unrecognized source type for page appending = ' + originType));
    }
    
    cb();
}

function createPage(inPage,inAccumulatedDims,inPDFWriter,inRenderingHelpers,callback) {
	var thePageDriver;
	if(inPage.modifiedFrom !== undefined)
	{
		thePageDriver = new ModifiedPageDriver(inPDFWriter,inPage.modifiedFrom);
	}
	else
	{
		// accumulate required properties [syntax test]
		inAccumulatedDims.width = inPage.width || inAccumulatedDims.width;
		inAccumulatedDims.height = inPage.height || inAccumulatedDims.height;
		thePageDriver = new NewPageDriver(inPDFWriter,inAccumulatedDims.width,inAccumulatedDims.height);
	}

	thePageDriver.links = []; // save links on page object

    async.eachSeries(inPage.boxes,
        function(inBox,cb)
        {
            renderBox(inBox,thePageDriver,inPDFWriter,inRenderingHelpers);
            cb();
        },
        function(err) {
            if(err)
                return callback(err);
                
			try {
	            thePageDriver.writePage(thePageDriver.links);
			}
			catch(err) {
	            return callback(err);
			}
            callback();
        }
    );
}

function renderBox(inBox,inPDFPage,inPDFWriter,inRenderingHelpers)
{
	// render the box
	if(inBox.items)
	{
		inBox.items.forEach(function(inItem)
		{
			renderItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers);
		});
	}
	else if(inBox.image)
		renderImageItem(inBox,inBox.image,inPDFPage,inPDFWriter,inRenderingHelpers);
	else if(inBox.shape)
		renderShapeItem(inBox,inBox.shape,inPDFPage,inPDFWriter,inRenderingHelpers);
	else if(inBox.text)
		renderTextItem(inBox,inBox.text,inPDFPage,inPDFWriter,inRenderingHelpers);
	else if(inBox.stream)
		renderStreamItem(inBox,inBox.stream,inPDFPage,inPDFWriter,inRenderingHelpers);

	// collect box ID. collecting it after to allow reference in repeaters
	// [meaning, allow a later ID to override this ID]
	inRenderingHelpers.documentBoxMap.collectBoxId(inBox);
}


function renderItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers)
{
	switch(inItem.type)
	{
		case 'image': 
			renderImageItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers);
			break;
		case 'shape':
			renderShapeItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers);
			break;
		case 'text':
			renderTextItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers);
			break;
		case 'stream':
			renderStreamItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers);
			break;
	}

}

function renderImageItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers)
{
	var opts = {};

	opts.index = inItem.index;
	opts.transformation = inItem.transformation;
	if(opts.transformation && !_.isArray(opts.transformation) &&
		!opts.transformation.width &&
		!opts.transformation.height)
	{
		opts.transformation.width = inBox.width;
		opts.transformation.height = inBox.height;
	}

	var imageItemMeasures = inRenderingHelpers.measurements.getImageItemMeasures(inItem,inPDFWriter);

	if(inBox.top !== undefined && inBox.bottom == undefined)
	{
		if(typeof(inBox.top) == 'object')
			inRenderingHelpers.measurements.computeBoxTopFromAnchor(inBox,inPDFWriter);
		inBox.bottom = inBox.top - (inBox.height !== undefined ? inBox.height:imageItemMeasures.height);
	}

	var left = getLeftForAlignment(inBox,inItem,inPDFWriter,inRenderingHelpers);
	var imagePath = inRenderingHelpers.filesMap.get(inItem.source);
	if(imagePath)
		inPDFPage.startContentContext().drawImage(left,inBox.bottom,imagePath,opts);	

	if(inItem.link)
		inPDFPage.links.push({link:inItem.link,rect:[left,inBox.bottom,left+imageItemMeasures.width,inBox.bottom+imageItemMeasures.height]});

}

function getLeftForAlignment(inBox,inItem,inPDFWriter,inRenderingHelpers)
{
	if(!inBox.alignment || inBox.alginment == "left")
		return inBox.left;
	else if(inBox.alignment == "right")
	{
		return inBox.left + inBox.width - inRenderingHelpers.measurements.getItemMeasures(inItem,inBox,inPDFWriter).width;
	}
	else
	{
		// center
		return inBox.left + (inBox.width - inRenderingHelpers.measurements.getItemMeasures(inItem,inBox,inPDFWriter).width)/2;
	}
}

function renderShapeItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers)
{

	if(inBox.top !== undefined && inBox.bottom == undefined)
	{
		if(typeof(inBox.top) == 'object')
			inRenderingHelpers.measurements.computeBoxTopFromAnchor(inBox,inPDFWriter);
		inBox.bottom = inBox.top - (inBox.height !== undefined ? inBox.height:inRenderingHelpers.measurements.getShapeItemMeasures(inItem).height);
	}

	var left = getLeftForAlignment(inBox,inItem,inPDFWriter,inRenderingHelpers);

	switch(inItem.method)
	{
		case 'rectangle':
			inPDFPage.startContentContext().drawRectangle(left,inBox.bottom,inItem.width,inItem.height,inItem.options);
			break;
		case 'square':
			inPDFPage.startContentContext().drawSquare(left,inBox.bottom,inItem.width,inItem.options);
			break;
		case 'circle':
			// translate bottom/left to center
			inPDFPage.startContentContext().drawCircle(left+inItem.radius,inBox.bottom+inItem.radius,inItem.radius,inItem.options);
			break;
		case 'path':
			// translate bottom left to paths points
			var args = inItem.points.slice();
			for(var i=0;i<args.length;i+=2)
			{
				args[i]+=left;
				args[i+1]+=inBox.bottom;
			}
			if(inItem.options)
				args.push(inItem.options);
			var cxt = inPDFPage.startContentContext();
			cxt.drawPath.apply(cxt,args);
			break;
	}
}

function renderTextItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers)
{
	var theFont =  TextUtilities.getFont(inPDFWriter,inItem,inRenderingHelpers.filesMap);
	if(!theFont)
			return;
	inItem.options.font = theFont;

	var theText = TextUtilities.computeTextForItem(inItem);

	if(inBox.top !== undefined && inBox.bottom == undefined)
	{
		if(typeof(inBox.top) == 'object')
			inRenderingHelpers.measurements.computeBoxTopFromAnchor(inBox,inPDFWriter);
		inBox.bottom = inBox.top - (inBox.height !== undefined ? inBox.height:inRenderingHelpers.measurements.getTextItemMeasures(inItem,inPDFWriter).height);
	}

	var left = getLeftForAlignment(inBox,inItem,inPDFWriter,inRenderingHelpers);

	inPDFPage.startContentContext().writeText(theText,left,inBox.bottom,inItem.options);


	if(inItem.link)
	{
		var measures = inRenderingHelpers.measurements.calculateTextDimensions(theFont,theText,inItem.options.size);
		inPDFPage.links.push({link:inItem.link,rect:[left+measures.xMin,inBox.bottom+measures.yMin,left+measures.xMax,inBox.bottom+measures.yMax]});
	}
}
		
function renderStreamItem(inBox,inItem,inPDFPage,inPDFWriter,inRenderingHelpers)
{
	StreamObjectComposer.composeStreamItem(
		inBox,
		inItem,
		inPDFWriter,
		inRenderingHelpers.measurements,
		inRenderingHelpers.filesMap,
		function(inText,inStart,inLimit,inDirection,inStyle,inState) {
			renderRun(inText,inStart,inLimit,inDirection,inStyle,inState,inPDFPage,inRenderingHelpers,inPDFWriter);
		});
}

function renderRun(inText,inStart,inLimit,inDirection,inStyle,inState,inPDFPage,inRenderingHelpers,inPDFWriter)
{
	var itemMeasures;
	if(inStyle.type !== undefined)
	{
		// regular item, place using regular method, with a new box stating it's position
		var theItem;
		if(inStyle.type == 'text')
		{
			theItem = _.clone(inStyle);
			theItem.text = inText.substring(inStart,inLimit);
		}
		else
		{
			theItem = inStyle;
		}
		theItem.direction = inDirection;
		var theBox = {left:inState.xOffset,bottom:inState.yOffset,items:[theItem]};
		renderItem(theBox,theItem,inPDFPage,inPDFWriter,inRenderingHelpers);
		itemMeasures = inRenderingHelpers.measurements.getItemMeasures(theItem,theBox,inPDFWriter);
	}
	else
	{
		// a box (inline frame). create a copy of the box, and replace the xOffset and yOffset
		// ponder:replacing. should i add? right now will not support non-0 coordinates
		// of box...oh well...we still have to figure out what its good for anyways
		var newBox = _.clone(inStyle);
		newBox.left = inState.xOffset;
		newBox.bottom = inState.yOffset;
		renderBox(newBox,inPDFPage,inPDFWriter,inRenderingHelpers);
		itemMeasures = inRenderingHelpers.measurements.calculateBoxMeasures(newBox,inPDFWriter);
	}	

	inState.xOffset += itemMeasures.width;
	inState.height = Math.max(inState.height,itemMeasures.height);
}