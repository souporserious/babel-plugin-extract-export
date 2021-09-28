import { NodePath, types as BabelTypes } from '@babel/core'

export type PluginState = {
  refs: Set<NodePath<BabelTypes.Identifier>>
  exportIdentifierName: string
}
