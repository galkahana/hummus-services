var _ = require('lodash'),
	bidi = require('icu-bidi');
	
module.exports = {

	computeTextForItem : function(inItem)
	{
		var theText = _.isArray(inItem.text) ? inItem.text.join(''):inItem.text;
	
		var p = bidi.Paragraph(theText,{paraLevel: inItem.direction == 'rtl' ? bidi.RTL:bidi.LTR});
	
		return p.writeReordered(bidi.Reordered.KEEP_BASE_COMBINING);
	},
	getFont : function(inPDFWriter,inItem,inFilesMap)
	{
		var result; 
		var fontPaths = inFilesMap.get(inItem.options.fontSource);
		if(fontPaths)
		{
			var fontPath = (typeof fontPaths === 'string') ? fontPaths : (fontPaths.length ? fontPaths[0]:null);
			if(!fontPath) {
				// shouldn't happen, but giving another chance
				result = inItem.options.font;
			}
			else {
				var secondPath = (typeof fontPaths !== 'string' && fontPaths.length == 2) ? fontPaths[1]:null;

				var secondArg = secondPath ? (secondPath) : ((inItem.options && inItem.options.fontIndex) ? inItem.options.fontIndex : null);
				result = secondArg ? inPDFWriter.getFontForFile(fontPath,secondArg) : inPDFWriter.getFontForFile(fontPath);
			}
		}
		else
			result = inItem.options.font;
	
		return result;
	}
};