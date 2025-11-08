const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        popup: "./src/popup/popup.js", // Entry point for popup script
        content: "./src/content/content.js", // Entry point for content script
    },
    output: {
        path: path.resolve(__dirname, "dist"), // Output directory
        filename: "[name].js", // Output filename pattern
    },
    module: {
        rules: [
            {
                test: /\.(?:js|mjs|cjs)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        targets: "defaults",
                        presets: [["@babel/preset-env"]],
                    },
                },
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "public", to: "." }, // Copy static assets (e.g., manifest.json, HTML files, icons)
            ],
        }),
    ],
};
