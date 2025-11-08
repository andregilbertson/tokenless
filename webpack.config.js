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
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    targets: {
                                        browsers: ["> 1%", "last 2 versions", "ie >= 11"]
                                    },
                                    modules: "commonjs"
                                }
                            ]
                        ]
                    }
                },
            },
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "public", to: "." }, // Copy static assets (e.g., manifest.json, HTML files, icons)
                { 
                    from: "node_modules/dictionary-en/index.aff", 
                    to: "dictionary-en/index.aff" 
                },
                { 
                    from: "node_modules/dictionary-en/index.dic", 
                    to: "dictionary-en/index.dic" 
                },
            ],
        }),
    ],
};
