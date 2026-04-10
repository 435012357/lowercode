import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    plugins: [
      "import",
      "jsdoc",
      "promise",
      "react",
      "react-perf",
      "jsx-a11y",
      "promise",
    ],
    rules: {
      "no-console": "error",
      "no-debugger": "error",
    },
  },
  fmt: {
    printWidth: 80,
    semi: false,
    singleQuote: true,
    sortImports: {},
    sortTailwindcss: {},
    sortPackageJson: true,
  },
});
