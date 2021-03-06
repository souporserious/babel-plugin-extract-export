import { NodePath, PluginObj, types as BabelTypes } from '@babel/core'
import * as t from '@babel/types'
import { PluginState } from './types'
import { getIdentifier, isIdentifierReferenced, removeExports } from './utils'

export default function (_, options: PluginState): PluginObj {
  return {
    visitor: {
      Program: {
        enter(path) {
          path.traverse({ ExportNamedDeclaration: removeExports }, options)

          let count: number

          function sweepType(
            sweepPath:
              | NodePath<BabelTypes.TSInterfaceDeclaration>
              | NodePath<BabelTypes.TSTypeAliasDeclaration>
              | NodePath<BabelTypes.TSEnumDeclaration>
              | NodePath<BabelTypes.TSModuleDeclaration>
          ) {
            const local = sweepPath.get('id') as NodePath<BabelTypes.Identifier>
            if (!isIdentifierReferenced(local)) {
              ++count
              sweepPath.remove()
            }
          }

          function sweepVariable(
            sweepPath: NodePath<BabelTypes.VariableDeclarator>
          ) {
            if (sweepPath.node.id.type === 'Identifier') {
              const local = sweepPath.get(
                'id'
              ) as NodePath<BabelTypes.Identifier>
              if (!isIdentifierReferenced(local)) {
                ++count
                sweepPath.remove()
              }
            } else if (sweepPath.node.id.type === 'ObjectPattern') {
              const pattern = sweepPath.get(
                'id'
              ) as NodePath<BabelTypes.ObjectPattern>

              const beforeCount = count
              const properties = pattern.get('properties')
              properties.forEach((property) => {
                const local = property.get(
                  property.node.type === 'ObjectProperty'
                    ? 'value'
                    : property.node.type === 'RestElement'
                    ? 'argument'
                    : (function () {
                        throw new Error('invariant')
                      })()
                ) as NodePath<BabelTypes.Identifier>

                if (!isIdentifierReferenced(local)) {
                  ++count
                  property.remove()
                }
              })

              if (
                beforeCount !== count &&
                pattern.get('properties').length < 1
              ) {
                sweepPath.remove()
              }
            } else if (sweepPath.node.id.type === 'ArrayPattern') {
              const pattern = sweepPath.get(
                'id'
              ) as NodePath<BabelTypes.ArrayPattern>

              const beforeCount = count
              const elements = pattern.get('elements')
              elements.forEach((element) => {
                let local: NodePath<BabelTypes.Identifier>
                if (element.node?.type === 'Identifier') {
                  local = element as NodePath<BabelTypes.Identifier>
                } else if (element.node?.type === 'RestElement') {
                  local = element.get(
                    'argument'
                  ) as NodePath<BabelTypes.Identifier>
                } else {
                  return
                }

                if (!isIdentifierReferenced(local)) {
                  ++count
                  element.remove()
                }
              })

              if (beforeCount !== count && pattern.get('elements').length < 1) {
                sweepPath.remove()
              }
            }
          }

          function sweepFunction(
            sweepPath:
              | NodePath<BabelTypes.FunctionDeclaration>
              | NodePath<BabelTypes.FunctionExpression>
              | NodePath<BabelTypes.ArrowFunctionExpression>
          ): void {
            const identifier = getIdentifier(sweepPath)
            if (identifier?.node && !isIdentifierReferenced(identifier)) {
              ++count

              if (
                t.isAssignmentExpression(sweepPath.parentPath) ||
                t.isVariableDeclarator(sweepPath.parentPath)
              ) {
                sweepPath.parentPath.remove()
              } else {
                sweepPath.remove()
              }
            }
          }

          function sweepImport(
            sweepPath:
              | NodePath<BabelTypes.ImportSpecifier>
              | NodePath<BabelTypes.ImportDefaultSpecifier>
              | NodePath<BabelTypes.ImportNamespaceSpecifier>
          ): void {
            const local = sweepPath.get(
              'local'
            ) as NodePath<BabelTypes.Identifier>

            if (!isIdentifierReferenced(local)) {
              ++count
              sweepPath.remove()
              if (
                (sweepPath.parent as BabelTypes.ImportDeclaration).specifiers
                  .length === 0
              ) {
                sweepPath.parentPath.remove()
              }
            }
          }

          do {
            ;(path.scope as any).crawl()
            count = 0
            path.traverse({
              TSTypeAliasDeclaration: sweepType,
              TSInterfaceDeclaration: sweepType,
              TSEnumDeclaration: sweepType,
              TSModuleDeclaration: sweepType,
              VariableDeclarator: sweepVariable,
              FunctionDeclaration: sweepFunction,
              FunctionExpression: sweepFunction,
              ArrowFunctionExpression: sweepFunction,
              ImportSpecifier: sweepImport,
              ImportDefaultSpecifier: sweepImport,
              ImportNamespaceSpecifier: sweepImport,
            })
          } while (count)
        },
      },
    },
  }
}
