import { NodePath, types as BabelTypes } from '@babel/core'
import * as t from '@babel/types'
import { getTypeBinding } from 'babel-type-scopes'
import type { PluginState } from './types'

export function getIdentifier(
  path:
    | NodePath<BabelTypes.FunctionDeclaration>
    | NodePath<BabelTypes.FunctionExpression>
    | NodePath<BabelTypes.ArrowFunctionExpression>
): NodePath<BabelTypes.Identifier> | null {
  const parentPath = path.parentPath
  if (parentPath.type === 'VariableDeclarator') {
    const name = (parentPath as NodePath<BabelTypes.VariableDeclarator>).get(
      'id'
    )
    return name.node.type === 'Identifier'
      ? (name as NodePath<BabelTypes.Identifier>)
      : null
  }

  if (parentPath.type === 'AssignmentExpression') {
    const name = (parentPath as NodePath<BabelTypes.AssignmentExpression>).get(
      'left'
    )
    return name.node.type === 'Identifier'
      ? (name as NodePath<BabelTypes.Identifier>)
      : null
  }

  if (path.node.type === 'ArrowFunctionExpression') {
    return null
  }

  return path.node.id && path.node.id.type === 'Identifier'
    ? (path.get('id') as NodePath<BabelTypes.Identifier>)
    : null
}

const typeDeclarations = ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration']

export function isIdentifierReferenced(
  identifier: NodePath<BabelTypes.Identifier>
): boolean {
  const typeBinding = getTypeBinding(identifier, identifier.node.name)
  if (typeBinding) {
    let referenced = false
    identifier
      .findParent((path) => path.type === 'Program')
      ?.traverse({
        Identifier(path) {
          const isTypeDeclaration = typeDeclarations.includes(
            path.parentPath.type
          )
          if (
            !isTypeDeclaration &&
            path.node.name === typeBinding.path.node.name
          ) {
            referenced = true
          }
        },
      })
    return referenced
  }

  const binding = identifier.scope.getBinding(identifier.node.name)
  if (binding?.referenced) {
    // Functions can reference themselves, so we need to check if there's a
    // binding outside the function scope or not.
    if (binding.path.type === 'FunctionDeclaration') {
      return !binding.constantViolations
        .concat(binding.referencePaths)
        // Check that every reference is contained within the function:
        .every((ref) => ref.findParent((path) => path === binding.path))
    }
    return true
  }
  return false
}

function shouldRemoveExport(name: string, state: PluginState): boolean {
  return name !== state.exportName
}

export function removeExports(
  path: NodePath<BabelTypes.ExportNamedDeclaration>,
  state: PluginState
) {
  const specifiers = path.get('specifiers')
  if (specifiers.length) {
    specifiers.forEach((specifier) => {
      if (
        shouldRemoveExport(
          t.isIdentifier(specifier.node.exported)
            ? specifier.node.exported.name
            : specifier.node.exported.value,
          state
        )
      ) {
        specifier.remove()
      }
    })

    if (path.node.specifiers.length < 1) {
      path.remove()
    }
    return
  }

  const declaration = path.get('declaration') as NodePath<
    BabelTypes.FunctionDeclaration | BabelTypes.VariableDeclaration
  >
  if (declaration == null || declaration.node == null) {
    return
  }

  switch (declaration.node.type) {
    case 'FunctionDeclaration': {
      const name = declaration.node.id!.name
      if (shouldRemoveExport(name, state)) {
        path.remove()
      }
      break
    }
    case 'VariableDeclaration': {
      const inner = declaration.get(
        'declarations'
      ) as NodePath<BabelTypes.VariableDeclarator>[]
      inner.forEach((d) => {
        if (d.node.id.type !== 'Identifier') {
          return
        }
        const name = d.node.id.name
        if (shouldRemoveExport(name, state)) {
          d.remove()
        }
      })
      break
    }
    default: {
      break
    }
  }
}
