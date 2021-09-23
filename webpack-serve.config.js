const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.config');

module.exports = merge(common, {
  devServer: {
    static: path.join(__dirname, 'public'),
    compress: true,
    port: 9000
  },
  devtool: 'source-map',
  mode: 'development'
});
