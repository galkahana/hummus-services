var VectorMath = require('./vector-math'),
	bidi = require('icu-bidi'),
	_ = require('lodash'),
	StreamObjectComposer = require('./stream-object-composer'),
	TextUtilities = require('./text-utilities');


function Measurements(inDocumentBoxMap, inFilesMap) {
	this.documentBoxMap = inDocumentBoxMap;
	this.filesMap = inFilesMap;	
}

Measurements.prototype.computeBoxTopFromAnchor = function(inBox,inPDFWriter)
{
	/* 
		compute box top according to another box bottom, and an optional offset. this method
		of placement is used when looking to place "rows" of items one below the other, and not necesserily knowing
		where the items may be posited horizontal-wise. especially important when streams are placed, which have different
		content height per the composition
	*/

	var theAnchoredBox = (typeof(inBox.top.box) == 'object') ? inBox.top.box : this.documentBoxMap.getBoxByID(inBox.top.box);

	inBox.top = getBoxBottom(theAnchoredBox,inPDFWriter,this) + (inBox.top.offset ? inBox.top.offset:0);
}

function getBoxBottom(inBox,inPDFWriter,self)
{
	// if bottom exists, return it, unless it's a "bottom" that's
	// actually top, which is the case for a box that contains a stream
	// and does not have height defined
	if(inBox.bottom !== undefined && !(inBox.height === undefined && doesBoxHaveStream(inBox)))
		return inBox.bottom;

	// bottom does not exist, need to calculate per top, or per the case of heightless box that contains stream
	if(inBox.top !== undefined)
	{
		if(typeof(inBox.top) == 'object')
			self.computeBoxTopFromAnchor(inBox,inPDFWriter);
	}

	if(inBox.top !== undefined)
	{
		if(inBox.height !== undefined)
		{
			// case has top - simply substract
			return inBox.top - inBox.height;
		}
		else
		{
			// only top, but no height. so calculate height per items and substract from top
			return inBox.top - calculateBoxItemsHeight(inBox,inPDFWriter,self);
		}
	}
	else if(inBox.bottom !== undefined && inBox.height === undefined)
	{
		// case has bottom but no height - which necesserily means that there's a stream object here per the test at the top
		// calculate height from items and remove from bottom (which is actually top)
		return inBox.bottom - calculateBoxItemsHeight(inBox,inPDFWriter,self);
	}
	else
		return 0; // no top, no bottom...shouldn't happen
}

function doesBoxHaveStream(inBox)
{
	if(inBox.items)
	{
		var i = 0;
		for(;i<inBox.items.length;++i)
			if(inBox.items[i].type == 'stream')
				break;
		return i<inBox.items.length;
	}
	else 
		return inBox.stream;
}

function calculateBoxItemsHeight(inBox,inPDFWriter,self)
{
	return self.calculateBoxMeasures(inBox,inPDFWriter).height;
}

Measurements.prototype.calculateBoxMeasures = function(inBox,inPDFWriter)
{
	if(inBox.height !== undefined && inBox.width !== undefined)
		return {width:inBox.width,height:inBox.height};
	else
	{
		var itemsMeasures;

		if(inBox.items)
		{
			itemsMeasures = {width:0,height:0};
			inBox.items.forEach(function(inItem)
			{
				var itemMeasures = this.getItemMeasures(inItem,inBox,inPDFWriter);
				itemsMeasures.height = Math.max(itemMeasures.height,itemsMeasures.height);
				itemsMeasures.width+=itemMeasures.width;

			});

		}
		else if(inBox.image)
			itemsMeasures =  this.getImageItemMeasures(inBox.image,inPDFWriter);
		else if(inBox.shape)
		 	itemsMeasures = getShapeItemMeasures(inBox.shape);
		else if(inBox.text)
			itemsMeasures = this.getTextItemMeasures(inBox.text,inPDFWriter);
		else if(inBox.stream)
			itemsMeasures = getComposedStreamMeasures(inBox,inBox.stream,this,inPDFWriter);

		return {width:inBox.width === undefined ? itemsMeasures.width:inBox.width,
				height:inBox.height === undefined ? itemsMeasures.height:inBox.height};
	}
}

Measurements.prototype.getTextItemMeasures = function(inItem,inPDFWriter)
{
	var theFont = TextUtilities.getFont(inPDFWriter,inItem,this.filesMap);
	var theText = TextUtilities.computeTextForItem(inItem);
	if(theFont && theText.length > 0)
	{
		var measures =  this.calculateTextDimensions(theFont,theText,inItem.options.size);
		return {width:measures.xMax,height:measures.yMax}; // note, taking yMax, and not height, because we want the ascent and not the descent, which is below the baseline!
															// also taking xMAx...cause i want the advance and not just the start to end glyphs area
	}
	else
	{
		return {width:0,height:0};
	}
}

function hasNonSpace(inText)
{
	return inText.match(/[^\s]/);
}

Measurements.prototype.calculateTextDimensions = function(inFont,inText,inFontSize)
{
	// calculate the text measures. handles a bug where space only strings don't get their correct measures
	if(hasNonSpace(inText))
	{
		// may be ending with space, in which case i'll get the same problem as having spaces...so do a similar trick..with no height this time
		if(inText.search(/[\s]*$/) != inText.length)
		{
			var measures = inFont.calculateTextDimensions(inText+'a',inFontSize);
			var measuresA = inFont.calculateTextDimensions('a',inFontSize);
			measures.width-=measuresA.xMax;
			measures.xMax-=measuresA.xMax;
			return measures;
		}
		else
			return inFont.calculateTextDimensions(inText,inFontSize);
	}
	else
	{
		var measures = inFont.calculateTextDimensions('a'+inText+'a',inFontSize);
		var measuresA = inFont.calculateTextDimensions('aa',inFontSize);
		var dMeasure = inFont.calculateTextDimensions('d',inFontSize);
		dMeasure.width = measures.width-measuresA.width;
		dMeasure.xMin = 0;
		dMeasure.xMax = dMeasure.width;
		return dMeasure;
	}
}

function getShapeItemMeasures(inItem)
{
	var result;

	switch(inItem.method)
	{
		case 'rectangle':
			result = {width:inItem.width,height:inItem.height};
			break;
		case 'square':
			result = {width:inItem.width,height:inItem.width};
			break;
		case 'circle':
			result = {width:inItem.radius*2,height:inItem.radius*2};
			break;
		case 'path':
			var maxTop=0,
				maxRight=0;
			for(var i=0;i<inItem.points.length;i+=2)
			{
				if(inItem.points[i]> maxRight)
					maxRight = inItem.points[i];
				if(inItem.points[i+1]>maxTop)
					maxTop = inItem.points[i+1];
			}
			result = {width:maxRight,height:maxTop};
			break;
		default:
			result = {width:0,height:0};
	}	
	return result;				
}

Measurements.prototype.getItemMeasures = function(inItem,inBox,inPDFWriter) {
	var result;
	var itemType = inItem.type ? inItem.type:getBoxItemType(inBox);
	switch(itemType)
	{
		case 'image': 
			result = this.getImageItemMeasures(inItem,inPDFWriter);
			break;
		case 'shape':
			result = getShapeItemMeasures(inItem);
			break;
		case 'text':
			result = this.getTextItemMeasures(inItem,inPDFWriter);
			break;
		case 'stream':
			result = getComposedStreamMeasures(inBox,inItem,this,inPDFWriter);
			break;
	}

	return result;	
}

function getComposedStreamMeasures(inBox,inItem,self,inPDFWriter)
{	
	// composition saves the lowest line positioning in lowestContentOffset. if not done yet, compose on empty and save now.
	if(typeof inItem.lowestContentOffset == 'undefined')
		StreamObjectComposer.composeStreamItem(
			inBox,
			inItem,
			inPDFWriter,
			self,
			self.filesMap,
			function(inText,inStart,inLimit,inDirection,inStyle,inState) {
				computeRun(inText,inStart,inLimit,inDirection,inStyle,inState,self,inPDFWriter)
			});

	return {bottom:inItem.lowestContentOffset,height:inItem.contentHeight};
}

function computeRun(inText,inStart,inLimit,inDirection,inStyle,inState,self,inPDFWriter)
{
	var itemMeasures;
	if(inStyle.type !== undefined)
	{
		// regular item, place using regular method, with a new box stating it's position
		var theItem;
		if(inStyle.type == 'text')
		{
			theItem = _.clone(inStyle);
			theItem.text = inText;
		}
		else
		{
			theItem = inStyle;
		}
		theItem.direction = inDirection;
		var theBox = {left:inState.xOffset,bottom:inState.yOffset,items:[theItem]};
		itemMeasures = self.getItemMeasures(theItem,theBox,inPDFWriter);
	}
	else
	{
		// a box. create a copy of the box, and replace the xOffset and yOffset
		// ponder:replacing. should i add? right now will not support non-0 coordinates
		// of box...oh well...we still have to figure out what its good for anyways
		var newBox = _.clone(inStyle);
		newBox.left = inState.xOffset;
		newBox.bottom = inState.yOffset;
		itemMeasures = self.calculateBoxMeasures(newBox,inPDFWriter);
	}	

	inState.xOffset += itemMeasures.width;
	inState.height = Math.max(inState.height,itemMeasures.width);	
}

Measurements.prototype.getImageItemMeasures = function(inItem,inPDFWriter)
{
	// note that below, any derivation of the transformation width/height from the box width/height should have already happened

	var result;
	var imagePath = this.filesMap.getImageItemFilePath(inItem);
	
	if(inItem.transformation)
	{
		if(_.isArray(inItem.transformation))
		{
			if(imagePath)
			{
				var imageDimensions = inPDFWriter.getImageDimensions(imagePath);
				var bbox = [0,0,imageDimensions.width,imageDimensions.height];
				var transformedBox = VectorMath.transformBox(bbox,inItem.transformation);
				result = {width:transformedBox[2],height:transformedBox[3]};
			}
			else
				result = {width:0,height:0};
		}
		else
			result = {width:inItem.transformation.width,
						height:inItem.transformation.height};
	}
	else if(imagePath)
		result = inPDFWriter.getImageDimensions(this.filesMap.getImageItemFilePath(inItem)); 
	else
		result = {width:0,height:0}; 

	return result;
}

function getBoxItemType(inBox)
{
	if(inBox.text)
		return 'text';
	else if(inBox.shape)
		return 'shape';
	else if(inBox.image)
		return 'image';
	else
		return 'stream';
}

module.exports = Measurements;