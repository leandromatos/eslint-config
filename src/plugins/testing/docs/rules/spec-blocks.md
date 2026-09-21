# testing/spec-blocks

A test body is made of at most three blocks, arrange, act and assert, and a blank line is what
separates them.

The blank line is the label, so no comment repeats it. A fourth block is a second test hiding in
the first; and the first assertion opens the last block, so it never sits on the line after the
act.

## Rule details

👎 Examples of **incorrect** code:

```typescript
it('should answer the user', async () => {
  // Arrange
  const expectedUser = usersFactory.build()
  // Act
  const result = await usersService.findOneUser(params)
  expect(result).toEqual(expectedUser)
})
```

👍 Examples of **correct** code:

```typescript
it('should answer the user', async () => {
  const expectedUser = usersFactory.build()
  vi.mocked(usersRepository.findOneUser).mockResolvedValue(expectedUser)

  const result = await usersService.findOneUser(params)

  const [specification] = vi.mocked(usersRepository.findAllUsers).mock.calls[0] ?? []
  expect(result).toEqual(expectedUser)
  expect(specification?.getCriteria()).toMatchObject({ userId })
})
```

## Options

| Option       | Type     | What it decides          |
| ------------ | -------- | ------------------------ |
| `testFolder` | `string` | The tree the rule judges |

## Fixable

Yes for the assertion that shares the block of the act: the fix opens the assert block with a
blank line. The three-block ceiling is not fixed. Splitting a test is a decision.

## When not to use it

A suite whose tests are tables of cases, or one that uses a given/when/then helper instead of
blank lines.
