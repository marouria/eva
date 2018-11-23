const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

var config = {
  entry: './all-tests.js',
  output: {
    path: path.resolve(__dirname, 'test_build'),
    filename: 'testBundle.js'
  },
  target: 'node',
  externals: [nodeExternals()],
  node: {
    fs: 'empty'
  },

  watchOptions: {
    ignored: /node_modules/
  },

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        loader: 'null-loader'
      }
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({ expect: ["chai", "expect"] })
  ]
};


module.exports = config;
