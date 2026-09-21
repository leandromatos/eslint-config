# testing/typed-fixture

A fixture built as an object literal and handed to the subject carries the type the subject
declares for it.

An anonymous literal drifts in silence when the contract changes: the field that was renamed is
still there, the test still passes, and nothing says the shape is no longer the one the code takes.
The annotation makes it a compile error instead.

## Rule details

👎 Examples of **incorrect** code:

```typescript
const body = { fileableId: 'b1c2d3e4', extension: FileExtension.FIT }

await garminWebhooksService.createOrUpdateGarminActivityFile(body, fileUpload)
```

👍 Examples of **correct** code:

```typescript
const createOrUpdateGarminActivityFileBody: CreateOrUpdateGarminActivityFileBody = {
  fileableId: 'b1c2d3e4',
  extension: FileExtension.FIT,
}

await garminWebhooksService.createOrUpdateGarminActivityFile(createOrUpdateGarminActivityFileBody, fileUpload)
```

## Options

| Option       | Type     | What it decides          |
| ------------ | -------- | ------------------------ |
| `testFolder` | `string` | The tree the rule judges |

## Fixable

Yes. The fix annotates the declaration with the type the callee declares and imports that type
from the barrel of the folder it is declared in.

## When not to use it

A suite whose fixtures are built by factories everywhere, or one testing code with no named
parameter types.
