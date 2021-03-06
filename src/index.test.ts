import pluginTester from 'babel-plugin-tester'
import typescript from '@babel/plugin-syntax-typescript'

import plugin from './index'

pluginTester({
  plugin,
  filename: __filename,
  snapshot: true,
  babelOptions: { plugins: [[typescript, { isTSX: true }]] },
  tests: [
    {
      fixture: '../example.tsx',
      pluginOptions: {
        exportName: 'Avatar',
      },
    },
    {
      fixture: '../example.tsx',
      pluginOptions: {
        exportName: 'Box',
      },
    },
    {
      fixture: '../example.tsx',
      pluginOptions: {
        exportName: 'Button',
      },
    },
  ],
})
