const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const MergeFilesPlugin = require('merge-files-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

// postcss config
const postCSSConfig = {
    plugins: function(loader) {
        return [
            require('autoprefixer')(),
            require('precss')({
                variables: {
                    variables: require('./client/css/vars')
                }
            }),
            require('postcss-functions')({
                functions: require('./client/css/funcs')
            })
        ];
    },
    sourceMap: !isProduction
};

// css-loader config
const cssLoaderConfig = {
    modules: true,
    disableStructuralMinification: true,
    importLoaders: 3,
    minimize: isProduction,
    sourceMap: !isProduction
};

if (!isProduction) {
    cssLoaderConfig.localIdentName = "[name]__[local]___[hash:base64:5]";
}

// plugins

var plugins = [
    new webpack.NoEmitOnErrorsPlugin()
];

if (isProduction) {
    plugins = plugins.concat([
        new webpack.optimize.UglifyJsPlugin({
            output: {
                comments: false
            },
            test: /bundle\.js?$/
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    ]);
};

const extractCSS = new ExtractTextPlugin("bundle1.css");
const extractSCSS = new ExtractTextPlugin("bundle2.css");
const mergeBundles = new MergeFilesPlugin({
    filename: 'bundle.css',
    test: /bundle[0-9]\.css$/,
    deleteSourceFiles: true
});

plugins = plugins.concat([extractCSS, extractSCSS, mergeBundles]);

// webpack config/rules

const config = {
    entry: {
        bundle: ['babel-polyfill', path.join(__dirname, 'client/index.js')]
    },
    output: {
        path: path.join(__dirname, 'server/data/static/build'),
        publicPath: '/static/build/',
        filename: '[name].js'
    },
    plugins: plugins,
    module: {
        rules: [{
            test: /\.css$/,
            use: extractCSS.extract({
                fallback: 'style-loader',
                use: [{
                    loader: 'css-loader',
                    options: cssLoaderConfig
                }, {
                    loader: 'postcss-loader',
                    options: postCSSConfig
                }]
            })
        }, {
            test: /\.scss$/,
            use: extractSCSS.extract({
                fallback: 'style-loader',
                use: [{
                    loader: 'css-loader',
                    options: cssLoaderConfig
                }, {
                    loader: 'postcss-loader',
                    options: postCSSConfig
                }, {
                    loader: 'resolve-url-loader',
                    options: {
                        sourceMap: !isProduction
                    }
                }, {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: true
                    }
                }]
            })
        }, {
            test: /\.(png|gif)$/,
            use: [{
                loader: 'url-loader',
                options: {
                    name: '[name]@[hash].[ext]',
                    limit: 5000
                }
            }]
        }, {
            test: /\.svg$/,
            use: [{
                loader: 'url-loader',
                options: {
                    name: '[name]@[hash].[ext]',
                    limit: 5000
                }
            }, {
                loader: 'svgo-loader',
                options: {
                    multipass: true,
                    plugins: [
                        // by default enabled
                        {
                            mergePaths: false
                        }, {
                            convertTransform: false
                        }, {
                            convertShapeToPath: false
                        }, {
                            cleanupIDs: false
                        }, {
                            collapseGroups: false
                        }, {
                            transformsWithOnePath: false
                        }, {
                            cleanupNumericValues: false
                        }, {
                            convertPathData: false
                        }, {
                            moveGroupAttrsToElems: false
                        },
                        // by default disabled
                        {
                            removeTitle: true
                        }, {
                            removeDesc: true
                        }
                    ]
                }
            }]
        }, {
            test: /\.(pdf|ico|jpg|eot|otf|woff|ttf|mp4|webm)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name]@[hash].[ext]'
                }
            }]
        }, {
            test: /\.jsx?$/,
            include: path.join(__dirname, 'client'),
            loader: 'babel-loader'
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx', '.css', '.scss'],
        alias: {
            '#app': path.join(__dirname, 'client'),
            '#c': path.join(__dirname, 'client/components'),
            '#css': path.join(__dirname, 'client/css')
        }
    }
};

module.exports = config;
