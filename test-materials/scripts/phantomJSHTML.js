var page = require('webpage').create();
page.viewportSize = { width: 1366, height : 768 };

page.onLoadFinished = function(){
    page.render('../output/result.pdf',{format: 'pdf'});
    phantom.exit();
};

page.content = '<html><body>blablablabla</body></html>';
