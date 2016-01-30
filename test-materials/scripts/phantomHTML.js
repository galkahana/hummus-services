var phantom = require('phantom');

phantom.create('--web-security=no',function(ph) {
        ph.createPage(function(page) {
            page.set('viewportSize', { width: 1366, height : 768 });
            page.set('onLoadFinished', function(success) {
                page.render('../output/result1.pdf');
                ph.exit();
            })
            page.set('content','<html><body>blablablabla</body></html>');
        });
    });