module.exports = {
  entry: './assets/js/app.js',
  mode: 'production',
  watch: true,
  output: {
    path: `${__dirname}/public/dist`,
    filename: 'bundle.js',
  },
  module: {
    rules: [{
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [{
            loader: 'file-loader',
            options: {
              outputPath: 'css/',
              name: '[name].min.css'
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ],
  },
};