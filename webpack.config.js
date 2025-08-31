const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/js/main.js',
  output: {
    filename: 'globe-visualizer.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    library: {
      name: 'GlobeVisualizer',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    // Remove HtmlWebpackPlugin for standalone bundle
    // Keep CopyWebpackPlugin for development/testing
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: path.resolve(__dirname, '../Images'),
          to: 'images'
        },
        { 
          from: path.resolve(__dirname, 'src/temp'),
          to: 'temp'
        }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
  },
};