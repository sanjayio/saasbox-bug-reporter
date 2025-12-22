const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/widget.js',
  output: {
    filename: 'bug-reporter.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'BugReporter',
    libraryTarget: 'umd',
    libraryExport: 'default',
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
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['Chrome >= 60', 'Firefox >= 55', 'Safari >= 12', 'Edge >= 79']
                }
              }]
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
          },
          output: {
            comments: false,
          }
        },
        extractComments: false
      })
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  performance: {
    maxEntrypointSize: 300000, // 300 KiB
    maxAssetSize: 300000 // 300 KiB
  }
};
