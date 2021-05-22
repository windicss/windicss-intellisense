import path from "path";
import commonjs from '@rollup/plugin-commonjs';
import resolve from "@rollup/plugin-node-resolve";
import sucrase from "@rollup/plugin-sucrase";
import json from "@rollup/plugin-json";
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

const onwarn = warning => {
  // Silence circular dependency warning for sucrase
  if (warning.code === 'CIRCULAR_DEPENDENCY' && !warning.importer.indexOf(path.normalize('node_modules/sucrase'))) return;
}

export default [
  {
    input: 'src/extension.ts',
    output: [
      {
        file: dump("extension.js"),
        format: "cjs",
        sourcemap: !prod,
      }
    ],
    external: ['vscode'],
    plugins: [
      json(),
      tsPlugin,
      resolve(),
      commonjs()
    ],
    onwarn
  },
  {
    input: 'src/lib/dependencies.ts',
    output: [
      {
        file: dump("dependencies.js"),
        format: "cjs",
        sourcemap: !prod,
      }
    ],
    plugins: [
      json(),
      tsPlugin,
      resolve(),
      commonjs()
    ],
    onwarn
  }
]
