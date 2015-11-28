function PDFCopyingContexts(inPDFWriter) {
	this.copyingContexts = [];
	this.pdfWriter = inPDFWriter;
}

PDFCopyingContexts.prototype.getContext = function(inPDFFileName) {
	if(!this.copyingContexts[inPDFFileName])
		this.copyingContexts[inPDFFileName] = this.pdfWriter.createPDFCopyingContext(inPDFFileName);
	return this.copyingContexts[inPDFFileName];
}

module.exports = PDFCopyingContexts