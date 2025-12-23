const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
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
                  },
                  // Simplified config - remove core-js usage and modules
                  modules: false,
                  useBuiltIns: false
                }]
              ]
            }
          }
        }
      ]
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false,
              // Additional optimizations
              pure_funcs: ['console.log', 'console.info'],
              passes: 2
            },
            output: {
              comments: false
            }
          },
          extractComments: false
        })
      ],
      // Better tree shaking
      usedExports: true,
      sideEffects: false
    },
    resolve: {
      extensions: ['.js']
    },
    performance: {
      // Stricter limits for better optimization
      maxEntrypointSize: 100000, // 100 KiB
      maxAssetSize: 100000 // 100 KiB
    },
    // Enable stricter module handling
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? false : 'source-map'
  };
};