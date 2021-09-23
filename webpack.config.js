const path = require('path');

module.exports = {
  entry: {
    app: './src/index.ts',
    vendor: ['mapbox-gl']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'public'),
  },
  performance : { // bundle size of mapbox-gl bumps up vendor.js to ~813KiB, beyond the 244KiB hint
    hints : false
  }
};
