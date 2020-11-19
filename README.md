# type-validation-ts
This CLI generates type-guard validator functions from typescript types. It generates JSON schemas from typescript types with [https://www.npmjs.com/package/typescript-json-schema](typescript-json-schema) and then generates type-guard functions which validate unknown objects with those schemas.

## How it works

```typescript
interface HelloWorld {
  foo: string
  bar: number
}

function loadWorld(data: unknown) {
  if(isHelloWorld(data)) { // generated validator function
    console.log(data.foo, data.bar) // type-safe access to data.foo and data.bar
  }
}
```

Create a .ts file where you export all the types you want to generate vaildators for.

```typescript
export { Foo, Bar } from './path/to/module'
export { Foo2, Bar2 } from './path/to/module2'
```

To generate the validator functions run

```bash
generate-validators ./path/to/types.ts ./out/path/to/validators
```

You can now use the validator functions in your project (eg. an express server):

```typescript
import { isFoo, isBar } from './out/path/to/validators'

const app = new Express()

app.post('/foo', (req, rsp) => {
  if(!isFoo(req.body)) {
    rsp.status(400).send('Body is in wrong format!')
    return
  }
  // continue with type-safe access to req.body
})
```

## Setup

First, install the type-validation-ts package with `npm install type-validation-ts -D`

Then you have to install the [https://www.npmjs.com/package/jsonschema](jsonschema) package because the generated validate functions require it.

```bash
npm install jsonschema
```