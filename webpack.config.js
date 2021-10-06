const path = require('path')

module.exports = {
  entry: './frontend/main.js',
  output: {
    filename: 'main-bundled.js',
    path: path.resolve(__dirname, 'public')
  },
  devtool: 'source-map',
  mode: "development",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              "@babel/plugin-transform-runtime"
            ],
            sourceType: 'unambiguous'
          }
        }
      }
    ]
  }
}