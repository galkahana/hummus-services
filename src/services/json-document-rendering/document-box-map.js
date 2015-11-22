function DocumentBoxMap(inDocument) {
	this.boxIDToBox = {};	
	this.document = inDocument;
}

DocumentBoxMap.prototype.getBoxByID = function(inBoxID) {
	// if mapping exists due to natural order of rendering, good. if not, loop now all boxes
	if(!this.boxIDToBox[inBoxID])
		calculateBoxIDsToBoxes(this);
	return this.boxIDToBox[inBoxID];
};

function calculateBoxIDsToBoxes(documentBoxMap)
{
	documentBoxMap.document.pages.forEach(function(inPage)
	{
		if(inPage.boxes)
		{
			inPage.boxes.forEach(function(inBox)
			{
				if(inBox.id)
					documentBoxMap.boxIDToBox[inBox.id] = inBox;
			});
		}
	});
}

DocumentBoxMap.prototype.collectBoxId = function(inBox) {
	if(inBox.id)
		this.boxIDToBox[inBox.id] = inBox;
}

module.exports = DocumentBoxMap; 