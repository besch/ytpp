//  DEV
const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    content: "./src/extension/content.ts",
    background: "./src/extension/background.ts",
    "injected-app": "./src/injected-app/index.tsx",
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
              configFile: path.resolve(__dirname, "tsconfig.extension.json"),
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
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".css"],
    modules: ["node_modules"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
    clean: true,
  },
  optimization: {
    minimize: false,
    concatenateModules: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.REACT_APP_BASE_API_URL": JSON.stringify(
        process.env.REACT_APP_BASE_API_URL || ""
      ),
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "public/manifest.json",
          to: "manifest.json",
        },
        {
          from: "public/assets",
          to: "assets",
        },
      ],
    }),
  ],
};
