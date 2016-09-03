var hummus = require('hummus');

function ModifiedPageDriver(inPDFWriter,inPageIndex)
{
	this.pdfWriter = inPDFWriter;
	this.pdfPageInput = inPDFWriter.getModifiedFileParser().parsePage(inPageIndex);
	this.pageModifier = new hummus.PDFPageModifier(inPDFWriter,inPageIndex,true);
}

ModifiedPageDriver.prototype.startContentContext = function()
{
	return this.pageModifier.startContext().getContext();
}

ModifiedPageDriver.prototype.getPageHeight = function() {
	var mediaBox = this.pdfPageInput.getMediaBox();
	return mediaBox[3]-mediaBox[1];
}


ModifiedPageDriver.prototype.writePage = function(inLinks)
{
	if(this.pageModifier.getContext())
		this.pageModifier.endContext();

	if(inLinks.length > 0)
	{
		var self = this;
		inLinks.forEach(function(link)
		{
			self.pageModifier.attachURLLinktoCurrentPage(link.link,link.rect[0],link.rect[1],link.rect[2],link.rect[3]);
		});		
	}

	this.pageModifier.writePage();
}

module.exports = ModifiedPageDriver;