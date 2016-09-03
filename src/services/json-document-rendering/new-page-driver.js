function NewPageDriver(inPDFWriter,inWidth,inHeight)
{
	this.pdfWriter = inPDFWriter;
	this.pdfPage = inPDFWriter.createPage(0,0,inWidth,inHeight);
	this.height = inHeight;
}

NewPageDriver.prototype.startContentContext = function()
{
	return this.pdfWriter.startPageContentContext(this.pdfPage);
}

NewPageDriver.prototype.getPageHeight = function() {
	return this.height;
}

NewPageDriver.prototype.writePage = function(inLinks)
{
	if(inLinks.length > 0)
	{
		this.pdfWriter.pausePageContentContext(this.pdfWriter.startPageContentContext(this.pdfPage));
		var self = this;
		inLinks.forEach(function(link)
		{
			self.pdfWriter.attachURLLinktoCurrentPage(link.link,link.rect[0],link.rect[1],link.rect[2],link.rect[3]);
		});		
	}

	this.pdfWriter.writePage(this.pdfPage);
}

module.exports = NewPageDriver;