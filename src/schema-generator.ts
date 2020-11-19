import * as TJS from 'typescript-json-schema'
import fs from 'fs'

export class SchemaGenerator {
  protected readonly settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true,
    excludePrivate: true,
  }
  protected readonly program: TJS.Program
  protected readonly generator: TJS.JsonSchemaGenerator

  constructor(
    protected readonly typesModulePath: string,
    protected readonly validatorModulePath: string,
    protected readonly tsConfigPath: string
  ) {
    if (!fs.existsSync(this.schemaPath)) {
      fs.mkdirSync(this.schemaPath, { recursive: true })
    }

    this.program = TJS.programFromConfig(tsConfigPath, [typesModulePath])
    const generator = TJS.buildGenerator(this.program, this.settings)
    if (!generator) {
      throw new Error('Schema generator could not be created!')
    }
    this.generator = generator
  }

  get schemaPath(): string {
    return `${this.validatorModulePath}/schemas`
  }

  createSchema(typeName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const schema = this.generator.getSchemaForSymbol(typeName)
      fs.writeFile(
        `${this.schemaPath}/${typeName}.schema.json`,
        JSON.stringify(schema, null, 2),

        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }
}
