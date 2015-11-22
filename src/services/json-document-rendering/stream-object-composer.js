var	bidi = require('icu-bidi'),
	_ = require('lodash'),
	TextUtilities = require('./text-utilities')

/*
	Compose a stream item (sort in lines). Composition will order lines and immediately render them per
	inRenderRunMethod. this saves time and having to create an interim structure (for
	now it's not needed for the document renderer) 
	
	inputs:
	inBox - box in which the stream item is found. for box limits n' such
	inItem - the stream item
	inMeasurements - measurements helper
	inFilesMap - files map, for external files mapping to local files
	inRenderRunMethod - rendering method for stream runs. This should allow you to draw while composing. you can also just compose
						for the sake of figuring out measures
*/
function composeStreamItem(
	inBox,
	inItem,
	inPDFWriter,
	inMeasurements,
	inFilesMap,
	inRenderRunMethod)
{
	calculateBoxTopAndBottomForStream(inBox,inPDFWriter,inMeasurements);

	var alignment = inBox.alignment === undefined ? (inItem.direction == 'rtl' ? 'right':'left'):inBox.alignment;


	// transform the stream items to a structure that is defined by a plain text stream
	// representing the stream text [non textual elements are represented by placeholder characters]
	// and an accompanying array providing run data (which is essentially inItem.items with index pointers into the text
	// stream array)
	var logicalLines = createLogicalTextDataLines(inItem);

	var top = (inBox.top !== undefined ? inBox.top : (inBox.bottom + (inBox.height !== undefined ? inBox.height:0)));
	var left = inBox.left;

	var lineCompositionState =  {
		height:0,
		xOffset:left,
		yOffset:top,
		firstLine:true,
		leading:inItem.leading ? inItem.leading:1.2,
		box:inBox,
		item:inItem,
		pdfWriter:inPDFWriter,
		measurements:inMeasurements,
		filesMap:inFilesMap,
		renderRun:inRenderRunMethod,
		lineSpacingModifier:function()
		{
			return this.firstLine?1:this.leading;
		},
		lineSpacing:function()
		{
			return this.height*this.lineSpacingModifier();
		},
		startLine:function(inDirection,inWidth,inHeight)
		{
			// before a lign is rendered. when there's already knowledge
			// of the line width. setup alignment. the direction determines
			// the default if no alignment is defined
			if(alignment == 'center')
				this.xOffset += (inBox.width - inWidth)/2;
			else if(alignment == 'right')
				this.xOffset += (inBox.width - inWidth);

			// setup baseline for text placement
			this.height = inHeight;
			this.yOffset -= this.lineSpacing();
			inItem.lowestContentOffset = this.yOffset;
			inItem.contentHeight = top - inItem.lowestContentOffset;	
		},
		reset:function()
		{
			// ran after line is rendered and finished. prpare for next line
			this.xOffset = left;
			this.height = 0;
			this.firstLine = false;
		}
	};

	for(var i=0;i<logicalLines.length;++i)
	{
		// loop logical lines and place. lines may be broken further to allow for text wrap where required
		if(!composeLine(logicalLines[i],lineCompositionState))
			break; // will break on overflow
	}
}

function calculateBoxTopAndBottomForStream(inBox,inPDFWriter,inMeasurements)
{
	if(inBox.top !== undefined && inBox.bottom == undefined)
	{
		if(typeof(inBox.top) == 'object')
			inMeasurements.computeBoxTopFromAnchor(inBox,inPDFWriter);
		inBox.bottom = inBox.top - (inBox.height !== undefined ? inBox.height:0);
	}
}

var kDefaultInlineObjectChar = '?';

function createLogicalTextDataLines(inItem)
{
	var logicalLines = [];
	var currentText = '';
	var currentStyles = [];
	var currentTextLength = 0;

	// loop stream item creating an array of "logical lines"
	// the lines are spearated by text items with newlines (\r or \n or \r\n)
	// each line is made of a single string of text, where each character
	// represents either a real text character or an inline object (e.g. an image)
	// an additional array of "styles" has multiple objects, where each object 
	// represents either a text style run or an inline object. the "style" propery
	// will have the originla stream item. an additional "limit" property is an index that
	// represents the first characters index after this run.

	
	inItem.items.forEach(function(inItem)
	{
		if(inItem.type == 'text')
		{
			// texts may have line ends, analyse the text and finish line if necessary
			var theText = _.isArray(inItem.text) ? inItem.text.join(''):inItem.text;
			var textComponents = theText.match(/[^\r\n]+|\r\n|\n|\r/g);
			if(textComponents)
			{
				textComponents.forEach(function(inText)
				{
					if(inText.search(/\r|\n/) == -1)
					{
						// non line. append to current text line
						currentText+=inText;
						currentTextLength+=inText.length;
						currentStyles.push({style:inItem,limit:currentTextLength});
					}
					else
					{
						// line, finalize current line and restart
						if(currentStyles.length == 0)
							currentStyles.push({style:inItem}); // for empty line make sure the maintain the style for the newline height to be calculated
						logicalLines.push({text:currentText,styles:currentStyles});
						currentText = '';
						currentStyles = [];
						currentTextLength = 0;

					}
				});
			}	
		}
		else
		{
			// non texts are simple "one character" objects
			currentText+=kDefaultInlineObjectChar;
			currentTextLength+=1;
			currentStyles.push({style:inItem,limit:currentTextLength});
		}
	});

	// close a final line if one exists
	if(currentTextLength > 0)
		logicalLines.push({text:currentText,styles:currentStyles});

	return logicalLines;
}

function composeLine(inLine,inState)
{
	if(inLine.text.length > 0)
	{

		// compose line considering various items placement and direction
		return renderParagraph(inLine,inState);
	}
	else
	{
		// empty line, just increase yOffset per the newline height.
		var lineHeight = TextUtilities
							.getFont(inState.pdfWriter,
									inLine.styles[0],
									inState.filesMap)
									.calculateTextDimensions('d',inLine.styles[0].options.size)
									.yMax;
		if(inState.box.height !== undefined && inState.yOffset-lineHeight*inState.lineSpacingModifier() < inState.box.bottom)
		{
			return false;
		}
		else
		{
			inState.startLine(inState.item.direction,0,lineHeight);
			inState.reset();	
			return true;		
		}
	}
}

function renderParagraph(inLine,inState)
{
	var p = bidi.Paragraph(inLine.text,{paraLevel: inState.item.direction == 'rtl' ? bidi.RTL:bidi.LTR});

	var textLength = inLine.text.length;
	
	var paraLevel=1&p.getParaLevel();
	var direction = ((paraLevel == bidi.RTL) ? 'rtl':'ltr');
	var nonSpaceEndIndex = inLine.text.search(/[\s]*$/);
	// i'm looking to trim ending spaces, for propper alignment (centering and the opposite)
	var measures=getTextMeasures(p,inLine.text.substring(0,nonSpaceEndIndex),inLine.styles,inState);


	if(measures.width<=inState.box.width
		&& (
			inState.box.height == undefined || 
			(inState.yOffset-measures.height*inState.lineSpacingModifier() >= inState.box.bottom)))
	{
		// everything fits onto one line	
		// prepare rendering a new line from either left or right
		inState.startLine(direction,measures.width,measures.height);
		renderLine(p,inLine.text,0,nonSpaceEndIndex, inLine.styles, 0,inLine.styles.length,inState);
		inState.reset();
		return true;
	}
	else
	{
		var start=0, 
			styleRunStart = 0,
			rw = {limit:null, styleRunLimit:null,width:null,height:null,verticalOverflow:false},
			skipSpaces = false; // skip spaces is for line start. any spaces should be skipped after a line that got broken

		for(;;)
		{
			rw.limit = textLength;
			rw.styleRunLimit = inLine.styles.length;
			if(skipSpaces) // only false in the first line. skip spaces in line breaks so that text start at line start.
			{
				var nonSpaceIndex = inLine.text.substr(start).search(/[^\s]/);
				if(nonSpaceIndex != -1)
				{
					start+= nonSpaceIndex;
					if(start == textLength) // if the skipped spaces are the end of the text
					{
						break;
					}
				}
			}
			rw =  getLineBreak(inLine.text,start,rw.limit,p,inLine.styles,styleRunStart,rw.styleRunLimit,inState);
			
			if(rw.verticalOverflow)
			{
				break;
			}

			var line = p.setLine(start,rw.limit);
			// prepare rendering a new line
			// from either left or right
			inState.startLine(direction,rw.width,rw.height);
			renderLine(line,inLine.text,start,rw.limit,inLine.styles,styleRunStart,rw.styleRunLimit-styleRunStart,inState);
			inState.reset();
			if(rw.limit == textLength)
			{
				break;
			}
			start = rw.limit;
			styleRunStart=rw.styleRunLimit-1;
			if(start>=inLine.styles[styleRunStart].limit)
				++styleRunStart;

			if(!skipSpaces)
				skipSpaces = true;
		}
		return rw.verticalOverflow;
	}
}

function getTextMeasures(p,inText, inStyles,inState)
{
	// total text width. loop through logical runs
	var width=0,limit=0,stylesLimit=0,height =0;

	while(limit<inText.length)
	{
		// advance by logicalRun and style run, adding to width
		var logicalRun = p.getLogicalRun(limit);

		while(stylesLimit<inStyles.length && (stylesLimit<1 || inStyles[stylesLimit-1].limit<= logicalRun.logicalLimit))
		{
			// get the width of the range result.limit...Math.min(result.stylesLimit,logicalRun.limit)
			var runLimit = Math.min(inStyles[stylesLimit].limit,logicalRun.logicalLimit);
			var runMeasures = getRunMeasures(inText,limit,runLimit,logicalRun.dir,inStyles[stylesLimit].style,inState);

			width+=runMeasures.width;
			height = Math.max(height,runMeasures.height);
			limit = runLimit;
			if(runLimit == inStyles[stylesLimit].limit)
				++stylesLimit;
			else
				break; // if run limit is not style limit then it is the logical run limit. meaning - time to to move the next one
		}
		limit = logicalRun.logicalLimit;
	}

	return {width:width,height:height};	
}

function getRunMeasures(inText,inStart,inLimit,inDirection,inStyle,inState)
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
		var theBox = {left:0,bottom:0,items:[theItem]};
		itemMeasures = inState.measurements.getItemMeasures(theItem,theBox,inState.pdfWriter);
		if(!inState.firstLine && inStyle.type == 'text') // when not the first relevant line height is actually the font size, not the text height
			itemMeasures.height = inStyle.options.size;
	}
	else
	{
		// a box. create a copy of the box, and replace the xOffset and yOffset
		// ponder:replacing. should i add? right now will not support non-0 coordinates
		// of box...oh well...we still have to figure out what its good for anyways
		var newBox = _.clone(inStyle);
		newBox.left = inState.xOffset;
		newBox.bottom = inState.yOffset;
		itemMeasures = inState.measurements.calculateBoxMeasures(newBox,inState.pdfWriter);
	}	
	return itemMeasures;
}

function renderLine(inBidiLine,inText,inStart,inLimit,inStyleRuns,inStyleRunsStart,inStyleRunsCount,inState)
{
	var direction = inBidiLine.getDirection();
	if(direction != 'mixed')
	{
		// unidirectional
		if(inStyleRunsCount<=1)
			inState.renderRun(inText,inStart,inLimit,direction,inStyleRuns[inStyleRunsStart].style,inState);
		else
			renderDirectionalRun(inText,inStart,inLimit,direction,inStyleRuns,inStyleRunsStart,inStyleRunsCount,inState);
	}
	else
	{
		// mixed-directional
		var count,i;

		count = inBidiLine.countRuns();
		if(inStyleRunsCount<=1)
		{
			var style = inStyleRuns[inStyleRunsStart].style;
			// iterate over direcitonal runs
			for(i=0;i<count;++i)
			{
				var visRun = inBidiLine.getVisualRun(i);
				inState.renderRun(inText, inStart+visRun.logicalStart, inStart+visRun.logicalStart+visRun.length, visRun.dir, style,inState);
			}
		}
		else
		{
			for(i=0;i<count;++i)
			{
				var visRun = inBidiLine.getVisualRun(i);
				renderDirectionalRun(inText, inStart+visRun.logicalStart, inStart+visRun.logicalStart+visRun.length, visRun.dir, inStyleRuns,inStyleRunsStart,inStyleRunsCount,inState);
			}
		}
	}
}

function renderDirectionalRun(inText,inStart,inLimit,inDirection,inStyleRuns,inStyleRunsStart,inStyleRunsCount,inState)
{
	var i;

	if(inDirection == 'ltr')
	{
		var styleLimit;

		for(i=0;i<inStyleRunsCount;++i)
		{
			styleLimit = inStyleRuns[inStyleRunsStart + i].limit;
			if(inStart < styleLimit)
			{
				if(styleLimit>inLimit) { styleLimit=inLimit; }
				inState.renderRun(inText,inStart,styleLimit,inDirection,inStyleRuns[inStyleRunsStart + i].style,inState);
				if(styleLimit==inLimit) { break; }
				inStart=styleLimit;
			}
		}
	}
	else
	{
		var styleStart;

		for(i=inStyleRunsCount-1;i>=0;--i)
		{
			if(i>0)
				styleStart = inStyleRuns[inStyleRunsStart+i-1].limit;
			else
				styleStart = 0;

			if(inLimit>=styleStart)
			{
				if(styleStart<inStart) {styleStart=inStart;} 
				inState.renderRun(inText,styleStart,inLimit,inDirection,inStyleRuns[inStyleRunsStart + i].style,inState);
				if(styleStart == inStart){break;}
				inLimit = styleStart;
			}
		}
	}

}

function hasNonSpace(inText)
{
	return inText.match(/[^\s]/);
}

function getLineBreak(inText,inStart,inLimit,inBidi,inStyles,inStylesStart,inStylesLimit,inState)
{
	// getlinebreak will find a line break for content so that it can be placed in a line so that it
	// fits the box width/height.
	// get line break assumes that it is placed in a constant width box.
	// therefore if it can't place anything in the line, this will mark a necessary vertical overflow.

	var maxWidth = inState.box.width;
	var result = {width:0,limit:inStart,height:0,styleRunLimit:inStylesStart};
	
	// empty case
	if(inLimit == inStart)
		return result;

	// advance styles start to an affective range
	while(inStyles[result.styleRunLimit].limit < inStart)
		++result.stylesLimit;

	for(;;)
	{
		// advance by logicalRun and style run, adding to width
		var logicalRun = inBidi.getLogicalRun(result.limit);

		if(logicalRun.limit > inLimit) 
			logicalRun.limit = inLimit;

		// for each style in logical run. measure as style in full
		// if good - go on [advance limit and style limit]. if not, need to break. 
		while(result.styleRunLimit < inStylesLimit && (result.styleRunLimit<1 || inStyles[result.styleRunLimit-1].limit<= logicalRun.logicalLimit))
		{
			// get the width of the range result.limit...Math.min(result.styleRunLimit,logicalRun.limit)
			var runLimit = Math.min(inStyles[result.styleRunLimit].limit,logicalRun.logicalLimit);
			var runMeasures = getRunMeasures(inText,result.limit,runLimit,logicalRun.dir,inStyles[result.styleRunLimit].style,inState);
			if((result.width + runMeasures.width <=maxWidth) &&
				(inState.box.height == undefined || (inState.yOffset-runMeasures.height*inState.lineSpacingModifier() >= inState.box.bottom)))
			{
				// add run/logical run in full
				
				result.width+=runMeasures.width;
				result.height = Math.max(runMeasures.height,result.height);
				result.limit = runLimit;
				if(runLimit == inStyles[result.styleRunLimit].limit)
					++result.styleRunLimit;
				else
					break; // logical run finish...so finish
			}
			else
			{
				// got a break, break according to spaces, and finish
				var textComponentsStart = result.limit;
				var accumulatedWidth = 0;
				var accumulatedLimitAdd = 0;
				var accumulatedLimitAddToNonSpace = 0;
				var textComponents = inText.substring(result.limit,runLimit).match(/[^\s]+|[^\S]+/g);
				for(var i=0;i<textComponents.length;++i)
				{
					runMeasures = getRunMeasures(inText,textComponentsStart,result.limit+accumulatedLimitAdd+textComponents[i].length,logicalRun.dir,inStyles[result.styleRunLimit].style,inState);
					if((result.width + runMeasures.width <=maxWidth) &&
						(inState.box.height == undefined || (inState.yOffset-runMeasures.height*inState.lineSpacingModifier() >= inState.box.bottom)))	
					{
						// add word/spaces in
						accumulatedLimitAdd+=textComponents[i].length;
						if(hasNonSpace(textComponents[i]))
						{
							accumulatedWidth=runMeasures.width; // add space to width ONLY when a later non space would show up. this should fix up the alignment problem nicely
							accumulatedLimitAddToNonSpace = accumulatedLimitAdd;
						}
						result.height = Math.max(runMeasures.height,result.height);
				
					}
					else
					{
						// add to width what accumulated so far
						break;
					}
				}
				// add accumulated width/range of what of the text that got in. take the measures so that will trim any ending spaces
				result.width+=accumulatedWidth;
				result.limit+=accumulatedLimitAddToNonSpace;
				// advance style in 1 to get to the limit
				++result.styleRunLimit;				
				// force finish
				logicalRun.logicalLimit = inLimit;
				break;
			}
		}

		if(logicalRun.logicalLimit == inLimit) // ended text, break
			break;
	}

	result.verticalOverflow = (inStart == result.limit);

	return result;
}

module.exports = {
	composeStreamItem:composeStreamItem
}