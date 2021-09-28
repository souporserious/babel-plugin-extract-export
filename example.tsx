type GlobalProps = { as: any }

type BoxProps = { children: any } & GlobalProps

export const Box = (props: BoxProps) => <div {...props} />

const Stack = (props: { children: any; style?: any }) => <div {...props} />

export const Badge = (props: { children: any }) => <div {...props} />

interface ButtonProps {}

export const Button = (props: ButtonProps) => <Stack>Hello Button</Stack>
