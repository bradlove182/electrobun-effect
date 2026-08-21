import antfu from "@antfu/eslint-config"

export default antfu(
    {
        typescript: true,
        solid: true,
        formatters: {
            css: "prettier",
            html: "prettier",
        },
        stylistic: {
            indent: 4,
            semi: false,
            quotes: "double",
        },
        rules: {
            "yaml/indent": ["error", 4, { indicatorValueIndent: 2 }],
            "ts/no-explicit-any": ["error"],
        },
        ignores: ["docs/*"],
    },
)
