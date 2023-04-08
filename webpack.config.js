module.exports = {
    entry: './assets/js/app.js',
  mode: 'development',
    watch:true,
    output: {
      path: `${__dirname}/dist`,
      filename: 'bundle.js',
    },
    module: {
        rules: [
          {
            test: /\.scss$/,
            exclude: /node_modules/,
            use: [
              {
                  loader: 'file-loader',
                  options: { outputPath: 'css/', name: '[name].min.css'}
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