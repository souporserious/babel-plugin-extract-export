const { build } = require('esbuild')
const { dependencies } = require('./package.json')

build({
  entryPoints: ['src/index.ts', 'src/types.ts', 'src/utils.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'es2016',
  external: ['@babel/core', '@babel/types'].concat(Object.keys(dependencies)),
})
