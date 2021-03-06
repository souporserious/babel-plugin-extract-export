import { Image } from 'system'

const unusedVariable = 'foo'

function unusedFunction() {
  return 'bar'
}

export function Avatar() {
  const unusedNestedVariable = 'foo'
  function unusedNestedFunction() {
    return 'bar'
  }
  return <Image />
}

type SystemProps = { as: any }

type BoxProps = { children: any } & SystemProps

export const Box = (props: BoxProps) => <div {...props} />

const Stack = (props: { children: any; style?: any }) => <div {...props} />

export function Badge(props: { children: any }) {
  return <div {...props} />
}

interface ButtonProps {}

export const Button = (props: ButtonProps) => <Stack>Hello Button</Stack>
