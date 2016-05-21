var DEFAULT_SERVICE_URL = '__apiURL__';

var hummusService = {

    /*
        generatePDFDocument - generate a PDF document on hummus services and callback when done with
        a download url.
        
        inAccessToken - a token to identify the user. either the publicAPI token, or a private API token.
        inJobTicket - a job ticket object defining the PDF
        [inOptions] - options object (can omit)
        [inSuccessCB] - success callback. function(downloadURL,embedURL){} where downloadURL is a download url for the file, and embedURL is for embedding
        [inFailureCB] - failure callback. function(response){} where response is the error response
        
        inOptions can have the following properties:
        1. serviceURL - an alternative url to get hummus service from. defaults to __apiURL__
        
         
    */

	generatePDFDocument:function(inAccessToken,inJobTicket,inOptions,successCB,failureCB)
	{
        var accessToken = inAccessToken;
        
        
        // allow skipping options
        if(typeof inOptions == 'function')
        {
            failureCB = successCB;
            successCB = inOptions;
            inOptions = null;
        }

        // defaults        
		failureCB = failureCB || noOp;
		successCB = successCB || noOp;
        if(!inOptions) {
            inOptions = {};
        }
        
        var serviceURL = inOptions.serviceURL || DEFAULT_SERVICE_URL;
        
		function openPDFWhenDone(inData,successCB,failureCB)
		{
			if(inData.status == 0)
			{
                var baseURL = serviceURL + 
                            '/public/' + 
                            encodeURIComponent(inData.generatedFile.publicDownloadId);
                successCB(baseURL + '/download',baseURL + '/embed',{generatedFileId:inData.generatedFile._id});
			}
			else if(inData.status == 2 && failureCB)
			{
				failureCB(inData);
			}
			else
			{
				window.setTimeout(function()
				{
                    sendXHR({
                            url:serviceURL + '/generation-jobs/' + inData._id + '?full=true',
                            headers: [['Authorization', 'Bearer ' + accessToken]]},
                            function(responseText){
                                openPDFWhenDone(JSON.parse(responseText),successCB,failureCB);
                            },
                            failureCB);
				},1000);
			}
		}

        function sendXHR(options,success,failure) {
            if(typeof options == 'string') {
                options = {url:options};
            }
            var xhr = new XMLHttpRequest();
            xhr.open(options.method || 'GET', options.url, options.async === undefined ? true:options.async);
            if(options.headers) {
                options.headers.forEach(function(el) {
                    xhr.setRequestHeader(el[0],el[1]);
                })
            }
            xhr.onreadystatechange = function() {
                if (xhr.readyState == XMLHttpRequest.DONE) {
                    if(xhr.status == 200)
                        success(xhr.responseText);
                    else
                        failure({xhr:xhr});
                }
            }
            xhr.send(options.data);
        }
		
        sendXHR( {
                    method:'POST',
                    url:serviceURL + '/generation-jobs',
                    headers: [
                        ['Content-type','application/json; charset=utf-8'],
                        ['Authorization', 'Bearer ' + accessToken]
                    ],
                    data:((typeof inJobTicket == 'string') ? inJobTicket:JSON.stringify(inJobTicket))
                },
                function(responseText){
                    openPDFWhenDone(JSON.parse(responseText),successCB,failureCB);
                },
                failureCB);
	}
}

function noOp(){}