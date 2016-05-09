(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-54473292-1', 'auto');

var DEFAULT_SERVICE_URL = '__apiURL__';

var hummusService = {

    /*
        generatePDFDocument - generate a PDF document on hummus services and callback when done with
        a download url.
        
        inAccessToken - a token to identify the user. either the publicAPI token, or a private API token.
        inJobTicket - a job ticket object defining the PDF
        [inOptions] - options object (can omit)
        [inSuccessCB] - success callback. function(downloadURL){} where downloadURL is a downlod url for the file
        [inFailureCB] - failure callback. function(response){} where response is the error response
        
        inOptions can have the following properties:
        1. serviceURL - an alternative url to get hummus service from. defaults to __apiURL__
        2. forEmbed - boolean flag. false means that the pdf is intended for download. Otherwise for "embed", which would 
            either fit browser embed solution or window/tab opening. in other words - download adds attachment header, and embed
            does not
        
         
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
				ga('send', 'pageview',{'page':'/generated-files/id'}); // send tracking when done
                successCB(serviceURL + 
                            '/public/' + 
                            encodeURIComponent(inData.generatedFile.publicDownloadId) + 
                            (inOptions.forEmbed ? '/embed':'/download'));
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
		
		ga('send', 'pageview',{'page':'/generation-jobs/'}); // send tracking when starting
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