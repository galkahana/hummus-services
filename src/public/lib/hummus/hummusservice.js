(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-54473292-1', 'auto');

var hummusService = {

	generatePDFDocument:function(inServiceURL,inDocumentString,successCB,failureCB)
	{
		failureCB = failureCB || noOp;

		function openPDFWhenDone(inServiceURL,inData,successCB,failureCB)
		{
			if(inData.status == 0)
			{
				ga('send', 'pageview',{'page':'/generated-files/id'}); // send tracking when done
				successCB(inServiceURL + '/generated-files/' + inData.generatedFile);
			}
			else if(inData.status == 2 && failureCB)
			{
				failureCB(inData);
			}
			else
			{
				window.setTimeout(function()
				{
					$.get(inServiceURL + '/generation-jobs/' + inData._id,function( data ) {
						openPDFWhenDone(inServiceURL,data,successCB,failureCB);
					  }).fail(failureCB);
				},1000);
			}
		}

		
		ga('send', 'pageview',{'page':'/generation-jobs/'}); // send tracking when starting
		$.ajax({
				  type: 'POST',
				  url: inServiceURL + '/generation-jobs',
				  contentType: 'application/json; charset=utf-8',
				  data: inDocumentString,
				  error: function(jqXHR,textStatus,errorThrown){failureCB({jqXHR:jqXHR,textStatus:textStatus,errorThrown:errorThrown});}
				}).done(function( data ) {
					openPDFWhenDone(inServiceURL,data,successCB,failureCB);
				  });			

	}

}

function noOp(){}