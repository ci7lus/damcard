module.exports = {
  mode: "postcss",
  content: ["./src/**/*.html", "./src/**/*.ts", "./src/**/*.tsx"],
  whitelist: ["body", "html"],
  extractors: [
    {
      extensions: ["html", "ts", "tsx"],
      extractor: class TailwindExtractor {
        static extract(content) {
          return content.match(/[A-Za-z0-9-_:/]+/g) || []
        }
      },
    },
  ],
}
