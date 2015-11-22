function FilesMap(inExternals) {
	this.externalsLocalFiles = inExternals;
}

FilesMap.prototype.getLocalFile = function(inExternalName)
{
	return this.externalsLocalFiles[inExternalName];
};


FilesMap.prototype.getImageItemFilePath = function(inItem)
{
	if(inItem.path)
		return inItem.path;
	else if(inItem.external)
		return this.externalsLocalFiles[inItem.external];
	else
		return null;
};

FilesMap.prototype.getFontItemFilePath = function(inItem)
{
	if(inItem.options.fontPath)
		return inItem.options.fontPath;
	else if(inItem.options.fontExternal)
		return this.externalsLocalFiles[inItem.options.fontExternal];
	else
		return null;
};

FilesMap.prototype.getFontSecondItemFilePath = function(inItem)
{
	if(inItem.options.fontSecondPath)
		return inItem.options.fontSecondPath;
	else if(inItem.options.fontSecondExternal)
		return this.externalsLocalFiles[inItem.options.fontSecondExternal];
	else
		return null;
};

module.exports = FilesMap;