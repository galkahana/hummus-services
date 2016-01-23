var express = require('express'),
	bodyParser = require('body-parser'),
	path = require('path'),
	log = require('./services/logger'),
    configuration = require('./config/index'),
	app = express();
	
	
	
// middlewarez
	
// body parsing
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// cors handling
app.use(
	function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', "access-control-allow-origin, accept, content-type");
    next();
});

// static site
app.use('/',express.static(path.resolve(__dirname, './public')));


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
configuration.config(app, listen);