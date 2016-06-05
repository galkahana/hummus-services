/**
 * Created by galkahana on 7/9/15.
 *
 *  gulp script for public parts
 *
 *  following are main tasks (run: gulp taskname):
 *
 *  1. (default): cleanup existing distributables and create new ones
 *  2. run : for development, creates running environment and loads an example page. includes watching
 *
 *  parameters:
 *      -d - pass -d to create non-minified versions for CSSs and JSs when creating distributables
 *
 */

'use strict';

var gulp = require('gulp'),
    replace = require('gulp-batch-replace'),
    del = require('del'),
    gulpSequence = require('gulp-sequence'),
    fs = require('fs'),
    _ = require('lodash'),
    open = require('gulp-open'),
    cp = require('child_process'),
    chromeApp = require('./chromeapp'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    WebpackDevServer = require('webpack-dev-server'),
    webpack = require('webpack'),
    webpackConfig = require('./webpack.config.js'),
    activeWebpackConfig = webpackConfig,
    argv = require('yargs')
        .usage('$0 taskname [-d]')
        .alias('d', 'debug')
        .describe('d', 'create distributable components for debug')
        .argv;


/*
 configuration
 */
var config = {
    forDebug: false || argv.d,
    apiURL: 'http://localhost:3000/api',
    websiteURL: 'http://localhost:3000',
    publishApiURL: 'http://services.pdfhummus.com/api',
    publishWebsiteURL: 'http://services.pdfhummus.com',
    publishEnvVars: ['MONGODB_URI'],
    webpackRoot: '/assets'
};

// local overrides with config.json
if (fs.existsSync('./config.json')) {
    var savedConfig = JSON.parse(fs.readFileSync('./config.json'));

    for (var key in savedConfig) {
        if (savedConfig.hasOwnProperty(key)) {
            config[key] = savedConfig[key];
        }
    }

}

// replacements and preprocess
var kReplaces = [];

var defaultPreProcessData;
function calculatePreProcessData() {
    defaultPreProcessData = {
        context: {
            DEBUG: (config.forDebug) ? true : undefined,
            PUBLISH: (config.forPublish) ? true : undefined
        }
    };
}

function takeReplacesSnapshot() {
    kReplaces = _.map(config,function(value,key) {return ['__' + key + '__',value];});
}

// webpack setup. takes care of JS, Sass, angular templates etc. whatever is required
function setupWebpackConfig() {
    activeWebpackConfig = Object.create(webpackConfig);

    var stringReplaceParams = {
        multiple: _.map(kReplaces,
            function(value) {
                return {search: value[0], replace: value[1], flags: 'g'};
            })
    };

    // setup modules, as this is based on determined decisions
    if (!activeWebpackConfig.module) {
        activeWebpackConfig.module = {};
    }

    // js
    activeWebpackConfig.module.loaders.push(
        {
            test: /\.js$/,
            exclude: /(node_modules)\//,
            loader: (!config.forDebug ? 'uglify!' : '') +
            'ng-annotate' +
            '!string-replace?' + JSON.stringify(stringReplaceParams) +
            '!preprocess?' + JSON.stringify(defaultPreProcessData.context)
        }
    );

    // html
    activeWebpackConfig.module.loaders.push(
        {
            test: /\.html$/,
            exclude: /(node_modules)\//,
            loader:
            'html' +
            '!string-replace?' + JSON.stringify(stringReplaceParams) +
            '!preprocess?' + JSON.stringify(defaultPreProcessData.context)
        }
    );
}

// gulp tasks!

/*
 clean

 clean dist-spree and dist-customer folder

 */

gulp.task('clean', function(cb) {
    del(['./dist']).then(function(){cb()});
});


// images copy
gulp.task('dist-images', function() {
    return gulp.src(['./src/public/images*/**/*', './src/public/*/*/images/**/*'])
        .pipe(gulp.dest('./dist'));
});

// hummusservice client copy
gulp.task('dist-client-lib',function() {
    return gulp.src(['./src/public/js/lib/hummus*/**/*'])
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));    
});

// html copy for the base htmls (+ replaces) [templates are handled by webpack]
function gulpTaskHTML(inTaskName, inSourcePath, inTarget) {
    gulp.task(inTaskName, function() {
        return gulp.src(inSourcePath)
            .pipe(replace(kReplaces))
            .pipe(gulp.dest(inTarget));
    });
}

gulpTaskHTML('dist-html', './src/public/*.html', './dist');

// js+sass+templates (with webpack)
gulp.task('dist-app', function(callback) {
    webpack(activeWebpackConfig, function(err, stats) {
        if (err) {
            throw new gutil.PluginError("webpack", err);
        }
        gutil.log("[webpack]", stats.toString({colors: true}));
        callback();
    });
});

gulp.task('prepare-for-dist',function(callback) {
    takeReplacesSnapshot();
    calculatePreProcessData();
    setupWebpackConfig();    
    
    callback();
});

// full dist-spree (component) preparation
gulp.task('dist', gulpSequence('prepare-for-dist',['dist-images', 'dist-html','dist-client-lib'], 'dist-app'));


// default
gulp.task('default', gulpSequence('clean', 'dist'));


// development, run (+watch)

gulp.task('watch', [], function() {

    // Gal 13.7.2015: using relative paths because gulp.watch (internally - gaze)
    // requires it so for detecting added/removed files on these paths.
    // when using absolute paths gulp.watch will only look at modified files

    // anything handled outside of webpack
    gulp.watch(['src/public/images/**/*', 'src/public/*/*/images/**/*'], ['dist-images']);
    gulp.watch('src/public/*.html', ['dist-html']);
    gulp.watch('src/public/lib/hummus/**/*',['dist-client-lib']);

    // IMPORTANT! since using webpack, than watching the main file running works
    // through the webpack server!

});

gulp.task('webpack-replace-update',[],function(cb) {
    config.webpackRoot = '';
    cb();
});

// run
gulp.task('run-sequance', gulpSequence('webpack-replace-update','default', 'watch'));

var kBasePort = 8000;

gulp.task('run', ['run-sequance'], function(cb) {

    // change so hot replacement will work [make sure to also run webpack-replace-update]
    
    var rewrites = [
                { from: /\/console/, to: '/console.html'},
                { from: /\/login/, to: '/console.html'}
            ];
            
    ['about','contact','documentation'].forEach(function(value) {
        rewrites.push({
            from: new RegExp('\/' + value),
            to: '/' + value + '.html'
        })
    });

    // Start a webpack-dev-server
    new WebpackDevServer(webpack(activeWebpackConfig), {
        contentBase: __dirname + '/dist/',
        stats: {
            colors: true
        },
        historyApiFallback: {
            rewrites: rewrites
        },
        hot: true
    }).listen(kBasePort, function() {
            cb();
        });

    // load sample web page (using 127.0.0.1 so cookies will work. localhost will not have cookies updated)
    gulp.src(__filename)
        .pipe(open({
            uri: 'http://127.0.0.1:' + kBasePort + '/',
            app: chromeApp
        }));

});

gulp.task('prepare-for-publish',function(callback) {
    config.apiURL = config.publishApiURL;
    config.websiteURL = config.publishWebsiteURL;
    config.forPublish = true;
    callback();
});


var TEMP_DEPLOY_FILE = './_app.yaml',
    ORG_DEPLOY_FILE = './app.yaml';

gulp.task('prepare-env-vars-for-deploy',function(callback) {
    fs.readFile(ORG_DEPLOY_FILE, 'utf8', function(err,data) {
        if(err)
            return callback(err);
        data+= '\n\env_variables:\n';
        
        config.publishEnvVars.forEach(function(value) {
           data+='  ' + value + ': \'' + process.env[value] + '\'\n'
        });
        
        fs.writeFile(TEMP_DEPLOY_FILE,data,callback);
    });
});

gulp.task('google-deploy',function(callback) {
    // deploy to default environment
    cp.execSync('gcloud preview app deploy ' + TEMP_DEPLOY_FILE + ' --quiet --stop-previous-version ',{stdio:[0,1,2]});
    callback();
});


gulp.task('cleanup-deploy',function(cb) {
    del([TEMP_DEPLOY_FILE]).then(function(){cb();});
})

gulp.task('publish', gulpSequence('prepare-for-publish','prepare-env-vars-for-deploy','default','google-deploy','cleanup-deploy'));