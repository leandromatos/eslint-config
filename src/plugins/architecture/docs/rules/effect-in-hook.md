# leandromatos/architecture-effect-in-hook

An effect is written in a hook of its own, never in the component that renders.

React needs an effect to synchronize with something outside React, and its documentation says so: _"You do need
Effects to synchronize with external systems."_
([You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)). What this rule decides is
where that synchronization is written, not whether it is allowed.

A component reads better when the effect has a name. `useSessionTimeout` says what it does; a bare `useEffect` in the
middle of a component says only that something happens. The hook is also the one place a test reaches it without
rendering.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// src/features/auth/screens/sign-in.screen.tsx
export const SignInScreen = () => {
  useEffect(() => {
    const timer = setTimeout(signOut, TIMEOUT)

    return () => clearTimeout(timer)
  }, [])

  return null
}
```

👍 Examples of **correct** code:

```typescript
// src/features/auth/hooks/use-session-timeout.hook.ts
export const useSessionTimeout = () => {
  useEffect(() => {
    const timer = setTimeout(signOut, TIMEOUT)

    return () => clearTimeout(timer)
  }, [])
}

// src/features/auth/screens/sign-in.screen.tsx
export const SignInScreen = () => {
  useSessionTimeout()

  return null
}
```

## Options

Read from the `architecture` group of the options.

| Option           | Type                     | What it decides                                                                      |
| ---------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `effectHooks`    | `string[]`               | the hooks that synchronize with something outside React; an empty list turns it off  |
| `suffixToFolder` | `Record<string, string>` | whether the project writes the `hook` layer, which is the file an effect may live in |

The `nextjs` and `expo` tiers name `useEffect`, `useLayoutEffect` and `useInsertionEffect`. A project moving its
effects out of components passes `effectHooks: () => []`, and names them again once the moves are done.

## Fixable

No. Which hook the effect belongs to, and what to call it, is the decision the rule asks for.

## When not to use it

A project with no hook layer. The rule does not judge whether an effect is needed at all: a value derived from props
is computed while rendering, and a reaction to a click belongs in the handler, and neither is a question a file path
answers.
