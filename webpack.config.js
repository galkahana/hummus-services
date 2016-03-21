var webpack = require("webpack"),
    path = require("path"),
    CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");

module.exports = {

    context: path.join(__dirname, "./src/public"),
    entry: {
        default: "./js/app/default-app.js"
    },
    output: {
        path: path.join(__dirname, "/dist/assets"),
        filename: "[name].js",
        chunkFilename: "[id].chunk.js",
        publicPath: "/assets/"
    },
    plugins: [
        // jquery plugin used for bootstrap
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        // commons
        new CommonsChunkPlugin({
            filename: "commons.js",
            name: "commons"
        })
    ],
    module: {
        loaders: [
            // css
            {test: /\.css$/, loader: "style!css"},
            // sass
            {
                test: /\.scss$/,
                loaders: ["style", "css", "sass"]
            },
            // boostrap fonts
            {test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/font-woff'},
            {test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=application/octet-stream'},
            {test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file'},
            {test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url?limit=10000&mimetype=image/svg+xml'},

            // JS and html loaders is provided in gulp to allow optional minimification, replacement and preprocessing
        ]
    }
};

