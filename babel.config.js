module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: "defaults",
                modules: "cjs", // Transform ES modules to CommonJS
            },
        ],
    ],
};

