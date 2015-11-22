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
		var fontPath = inFilesMap.getFontItemFilePath(inItem);
		var secondPath = inFilesMap.getFontSecondItemFilePath(inItem);
		if(fontPath)
		{
			var secondArg = secondPath ? (secondPath) : ((inItem.options && inItem.options.fontIndex) ? inItem.options.fontIndex : null);
			result = secondArg ? inPDFWriter.getFontForFile(fontPath,secondArg) : inPDFWriter.getFontForFile(fontPath);
		}
		else
			result = inItem.options.font;
	
		return result;
	}
};