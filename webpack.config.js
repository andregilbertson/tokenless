const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        background: "./src/background/background.js",
        content: "./src/content/content.js",
        popup: "./src/popup/popup.js",
    },
    output: {
        path: path.resolve(__dirname, "dist"), // Output directory
        filename: "[name].js", // Output filename pattern
    },
    plugins: [
        new CopyPlugin({
            patterns: [{ from: "public", to: "." }],
        }),
    ],
};
