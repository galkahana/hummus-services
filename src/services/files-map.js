var path = require('path');

function FilesMap(inLocalFilesRoot,inExternals) {
	this.localFilesRoot = inLocalFilesRoot;
	this.externalsLocalFiles = inExternals;
}

FilesMap.prototype.getExternalFilePath = function(inExternalName)
{
	return this.externalsLocalFiles[inExternalName];
};

FilesMap.prototype.getLocalPath = function(inFilePath) 
{
	return localFilePath(this,inFilePath);	
};

function localFilePath(self,inPath) {
	if(path.isAbsolute(inPath) || !self.localFilesRoot)
		return inPath;
	else
		return path.resolve(self.localFilesRoot,inPath);
}

FilesMap.prototype.getItemFilePath = function(inItem) {
	if(inItem.path)
		return localFilePath(this,inItem.path);
	else if(inItem.external)
		return this.externalsLocalFiles[inItem.external];
	else
		return null;
}

FilesMap.prototype.getImageItemFilePath = function(inItem)
{
	return this.getItemFilePath(inItem);
};

FilesMap.prototype.getFontItemFilePath = function(inItem)
{
	if(inItem.options.fontPath)
		return localFilePath(this,inItem.options.fontPath);
	else if(inItem.options.fontExternal)
		return this.externalsLocalFiles[inItem.options.fontExternal];
	else
		return null;
};

FilesMap.prototype.getFontSecondItemFilePath = function(inItem)
{
	if(inItem.options.fontSecondPath)
		return localFilePath(this,inItem.options.fontSecondPath);
	else if(inItem.options.fontSecondExternal)
		return this.externalsLocalFiles[inItem.options.fontSecondExternal];
	else
		return null;
};

module.exports = FilesMap;