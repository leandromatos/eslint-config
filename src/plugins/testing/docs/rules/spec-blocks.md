# leandromatos/testing-spec-blocks

A test body is made of at most three blocks, arrange, act and assert, and a blank line separates them.

The blank line is the label, so no comment repeats it. A fourth block is a second test hiding in the first, and the
first assertion opens the last block, so it never sits on the line after the act. A test is read the same way whether it
is written with `it`, `test`, a modifier such as `it.only`, or a table such as `it.each([...])`. A group, a hook and a
step hang off the same call without being a test, so `test.describe`, `test.beforeEach` and `test.step` take any number
of blocks.

## Rule details

👎 Examples of **incorrect** code:

```typescript
it('answers the user', async () => {
  // Arrange
  const expectedUser = usersFactory.build()
  // Act
  const result = await usersService.findOneUser(params)
  expect(result).toEqual(expectedUser)
})
```

👍 Examples of **correct** code:

```typescript
it('answers the user', async () => {
  const expectedUser = usersFactory.build()
  vi.mocked(usersRepository.findOneUser).mockResolvedValue(expectedUser)

  const result = await usersService.findOneUser(params)

  expect(result).toEqual(expectedUser)
  expect(usersRepository.findOneUser).toHaveBeenCalledWith(params.userId)
})
```

## Options

Read from the `testing` group of the options.

| Option       | Type     | What it decides          |
| ------------ | -------- | ------------------------ |
| `testFolder` | `string` | the tree the rule judges |

## Fixable

Yes for an assertion that shares the block of the act: the fix opens the assert block with a blank line. The ceiling
of three blocks is not fixed, since splitting a test is a decision.

## When not to use it

A suite that uses a given, when, then helper instead of blank lines.
