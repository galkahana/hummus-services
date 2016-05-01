(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-54473292-1', 'auto');

var hummusService = {

	generatePDFDocument:function(inServiceURL,inAccessToken,inDocumentString,successCB,failureCB)
	{
        var accessToken = inAccessToken;
        
		failureCB = failureCB || noOp;
        
		function openPDFWhenDone(inServiceURL,inData,successCB,failureCB)
		{
			if(inData.status == 0)
			{
				ga('send', 'pageview',{'page':'/generated-files/id'}); // send tracking when done
                sendXHR({
                    url:inServiceURL + '/generated-files/' + inData.generatedFile,
                    headers: [['Authorization', 'Bearer ' + accessToken]]},
                    function(responseText){
                        successCB(inServiceURL + '/public/' + encodeURIComponent(JSON.parse(responseText).publicDownloadId) + '/download');
                    },
                    failureCB);
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
                            url:inServiceURL + '/generation-jobs/' + inData._id,
                            headers: [['Authorization', 'Bearer ' + accessToken]]},
                            function(responseText){
                                openPDFWhenDone(inServiceURL,JSON.parse(responseText),successCB,failureCB);
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
                    url:inServiceURL + '/generation-jobs',
                    headers: [
                        ['Content-type','application/json; charset=utf-8'],
                        ['Authorization', 'Bearer ' + accessToken]
                    ],
                    data:inDocumentString
                },
                function(responseText){
                    openPDFWhenDone(inServiceURL,JSON.parse(responseText),successCB,failureCB);
                },
                failureCB);
	}
}

function noOp(){}