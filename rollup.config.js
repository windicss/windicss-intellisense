import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import sucrase from "@rollup/plugin-sucrase";
import typescript from "@rollup/plugin-typescript";

const outputDir = "./out";

const prod = process.env.NODE_ENV === 'production';

const tsPlugin = prod
  ? typescript({
      target: "es5",
      include: "src/**",
      outDir: outputDir,
      typescript: require("typescript"),
    })
  : sucrase({
      exclude: ['node_modules/**'],
      transforms: ["typescript"],
    });

const dump = (file) => path.join(outputDir, file);

export default [
  {
    input: 'src/extension.ts',
    output: [
      {
        file: dump("extension.js"),
        format: "cjs",
        sourcemap: true,
      }
    ],
    external: ['vscode', 'esbuild-register'],
    plugins: [
      tsPlugin,
      resolve(),
    ]
  }
];
