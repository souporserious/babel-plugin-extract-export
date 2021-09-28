# babel-plugin-extract-export

This is a fork of the NextJS [SSG transform Babel plugin](https://github.com/vercel/next.js/blob/5544adc481f8821567e947a6e6d51d9d68ebd367/packages/next/build/babel/plugins/next-ssg-transform.ts) that reverses the logic and allows extracting a specific export and its dependencies.

## Install

```bash
yarn add babel-plugin-extract-export
```

## Example

```js
const babel = require('@babel/core')
const syntaxTypeScript = require('@babel/plugin-syntax-typescript')
const extractExport = require('babel-plugin-extract-export')

const jsx = `
import { Image } from 'system'

export const Avatar = () => <Image />

type SystemProps = { as: any }

type BoxProps = { children: any } & SystemProps

export const Box = (props: BoxProps) => <div {...props} />
`

const result = babel.transform(jsx, {
  configFile: false,
  plugins: [
    [syntaxTypeScript, { isTSX: true }],
    [extractExport, { exportName: 'Avatar' }],
  ],
})

// Output:
// import { Image } from 'system'
// export const Avatar = () => <Image />
```

## Development

```bash
yarn install && yarn test
```
