var path = require('path');

var localResources = {
	'arial':'./fonts/arial.ttf',
	'arial bold':'./fonts/arialb.ttf',
	'arial bold italic':'./fonts/arialbi.ttf',
	'arial black':'./fonts/arialbl.ttf',
	'arial black bold':'./fonts/arialblb.ttf',
	'arial black italic':'./fonts/arialbli.ttf',
	'arial italic':'./fonts/ariali.ttf',
	'comic sans':'./fonts/comicms.ttf',
	'comic sans bold':'./fonts/comicmsb.ttf',
	'courier':'./fonts/courier.ttf',
	'courier bold':'./fonts/courierb.ttf',
	'courier bold italic': './fonts/courierbi.ttf',
	'courier italic':'./fonts/courieri.ttf',
	'georgia':'./fonts/georgia.ttf',
	'georgia bold':'./fonts/georgiab.ttf',
	'georgia bold italic':'./fonts/georgiabi.ttf',
	'georgia italic':'./fonts/georgiai.ttf',
	'impact':'./fonts/impact.ttf'
};


function FilesMap(inLocalFilesRoot,inExternals) {
	this.localFilesRoot = inLocalFilesRoot;
	this.externalsLocalFiles = inExternals;
}

FilesMap.prototype.get = function(inData)
{
	if(typeof inData == 'string') {
		inData = {
			name:inData,
			origin:'external'
		}
	}
	
	if(!inData)
		return null;
	
	if(inData.origin == 'external')
		return this.externalsLocalFiles[inData.name];
	else if(inData.origin == 'local') {
		var local = localResources[inData.name];
		if(local) {
			return path.resolve(this.localFilesRoot,local);	
		}
		else
			return null;
	}
	else 
		return null;
};

module.exports = FilesMap;