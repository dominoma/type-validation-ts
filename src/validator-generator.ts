import { Project, VariableDeclarationKind, SourceFile } from 'ts-morph'

import path from 'path'

export class ValidatorGenerator {
  protected readonly project: Project

  protected readonly validatorsModule: SourceFile

  protected readonly typeModule: SourceFile

  protected readonly validatorTypesNamespace = 'ValidatorTypes'

  constructor(
    protected readonly typesModulePath: string,
    protected readonly validatorModulePath: string,
    protected readonly tsConfigPath: string
  ) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      addFilesFromTsConfig: false,
    })

    this.typeModule = this.project.addSourceFileAtPath(typesModulePath)

    this.validatorsModule = this.project.createSourceFile(
      `${validatorModulePath}/index.ts`,
      undefined,
      {
        overwrite: true,
      }
    )
    this.validatorsModule.addImportDeclaration({
      moduleSpecifier: path
        .relative(validatorModulePath, typesModulePath)
        .replace(/\\/g, '/')
        .replace(/\.ts$/, ''),
      namespaceImport: this.validatorTypesNamespace,
    })
    this.validatorsModule.addImportDeclaration({
      moduleSpecifier: 'jsonschema',
      namedImports: [
        {
          name: 'Validator',
        },
        {
          name: 'ValidationError',
        },
      ],
    })
    const validatorDecl = this.validatorsModule.addVariableStatement({
      declarations: [{ name: 'validator', initializer: 'new Validator()' }],
    })
    validatorDecl.setDeclarationKind(VariableDeclarationKind.Const)
    this.validatorsModule
      .getSourceFile()
      .insertText(0, '/* eslint-disable */\n')
  }

  getTypeNames(): string[] {
    return this.typeModule.getExportSymbols().map((el) => el.getName())
  }

  createValidationFunctions(typeName: string): void {
    this.validatorsModule.addImportDeclaration({
      moduleSpecifier: `./schemas/${typeName}.schema.json`,
      defaultImport: `${typeName}Schema`,
    })
    const validator = this.validatorsModule.addFunction({
      isExported: true,
      name: `is${typeName}`,
      parameters: [{ name: 'obj', type: 'unknown' }],
      returnType: `obj is ${this.validatorTypesNamespace}.${typeName}`,
    })
    validator.addStatements(
      `return validator.validate(obj, ${typeName}Schema as any).valid`
    )
    const asserter = this.validatorsModule.addFunction({
      isExported: true,
      name: `assert${typeName}`,
      parameters: [{ name: 'obj', type: 'unknown' }],
      returnType: `asserts obj is ${this.validatorTypesNamespace}.${typeName}`,
    })
    asserter.addStatements((writer) => {
      writer
        .writeLine(
          `const result = validator.validate(obj, ${typeName}Schema as any)`
        )
        .writeLine('if(!result.valid)')
        .block(() => {
          writer.writeLine(
            `throw new ValidationError(\`Object is not of type ${typeName}!\\n\${result.errors.join('\\n')}\`)`
          )
        })
    })
  }

  save(): Promise<void> {
    return this.validatorsModule.save()
  }
}
