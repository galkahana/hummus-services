function PDFCopyingContexts(inPDFWriter) {
	this.copyingContexts = [];
	this.pdfWriter = inPDFWriter;
}

PDFCopyingContexts.prototype.getContext = function(inPDFFileName,options) {
	if(!this.copyingContexts[inPDFFileName])
		this.copyingContexts[inPDFFileName] = this.pdfWriter.createPDFCopyingContext(inPDFFileName,options);
	return this.copyingContexts[inPDFFileName];
}

module.exports = PDFCopyingContexts