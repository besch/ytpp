//  DEV
const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    content: path.join(__dirname, "src", "extension", "content.ts"),
    background: path.join(__dirname, "src", "extension", "background.ts"),
    "injected-app": path.join(__dirname, "src", "injected-app", "index.tsx"),
  },
  mode: "development",
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              configFile: "tsconfig.extension.json",
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [require("tailwindcss"), require("autoprefixer")],
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".css"],
    modules: [path.resolve(__dirname, "src"), "node_modules"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
    publicPath: "/",
  },
  optimization: {
    minimize: false,
    concatenateModules: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.REACT_APP_BASE_API_URL": JSON.stringify(
        "${process.env.REACT_APP_BASE_API_URL}"
      ),
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
};
