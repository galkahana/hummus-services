var fs = require('fs'),
	async = require('async'),
	path = require('path');
    
function Configuration() {

	// responses
    var responses = function(app,callback) {
        var responsesDirName = path.resolve(__dirname,'./../responses');
        fs.readdirSync(responsesDirName).forEach(function(filename) {
            if (path.extname(filename) == '.js') {
                var response = require(responsesDirName + '/' + filename);
                app.use(response);
            }
        });
        callback();
    };

	// routes
    var routes = function(app,callback) {
        require('../routes/routes')(app);
        callback();
    };

    /**
     * Orchestrate the application configuration
     * @param app app instance
     */
    this.config = function(app, onReady) {
        async.auto({
            responses: function(callback) {
                responses(app,callback);
            },
            routes: function(callback) {
                routes(app,callback);
            }
        }, 
        function(err) {
          onReady(err);  
        });
    };
}

module.exports = new Configuration();
