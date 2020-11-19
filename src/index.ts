#!/usr/bin/env node

import { SchemaGenerator } from './schema-generator'
import { ValidatorGenerator } from './validator-generator'

export interface ConsoleParameters {
  typesModulePath: string
  validatorModulePath: string
  tsConfigPath: string
}

export function getParameters(): ConsoleParameters {
  console.log(process.argv)
  if (![4, 5].includes(process.argv.length)) {
    throw new Error(
      'Reqired parameters are missing. <type-file> <validaton-folder> [tscofig.json-path]'
    )
  }
  return {
    typesModulePath: process.argv[2],
    validatorModulePath: process.argv[3],
    tsConfigPath: process.argv[4] || './tsconfig.json',
  }
}

export { SchemaGenerator } from './schema-generator'
export { ValidatorGenerator } from './validator-generator'

async function run() {
  const params = getParameters()

  const schemaGenerator = new SchemaGenerator(
    params.typesModulePath,
    params.validatorModulePath,
    params.tsConfigPath
  )
  const validatorGenerator = new ValidatorGenerator(
    params.typesModulePath,
    params.validatorModulePath,
    params.tsConfigPath
  )

  const typeNames = validatorGenerator.getTypeNames()

  await Promise.all(
    typeNames.map(async (typeName) => {
      await schemaGenerator.createSchema(typeName)
      validatorGenerator.createValidateFunction(typeName)
    })
  )
  await validatorGenerator.save()
}

run()
