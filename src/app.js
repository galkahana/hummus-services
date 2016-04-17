var express = require('express'),
	bodyParser = require('body-parser'),
	path = require('path'),
	log = require('./services/logger'),
    configuration = require('./config/index'),
    errorHandler = require('./controllers/errors-controller'),
	app = express();
	
	
	
// middlewarez
	
// body parsing
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// cors handling and some allowed headers
app.use(
	function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', "access-control-allow-origin, accept, content-type, Authorization");
    next();
});

// static site
app.use(express.static(path.join(__dirname, '../dist')));


function startServer() {
    app.set('port', process.env.PORT || 3000);
    var server = app.listen(app.get('port'), function(err) {
        if (err) {
            log.error('Express server failed to listen on port ' + server.address().port);
        } else {
            log.info('Express server listening on port ' + server.address().port);
        }
    });
};

// TBD, may use cluster later
function listen() {
    log.info('Starting as STANDALONE server');
    startServer();
};

/*
    Load the server:
    1. configure
    2. when done - start listening by calling listen();
*/
configuration.config(app, function() {
    listen();

    app.use(errorHandler);

});