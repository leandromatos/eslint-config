import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'

/*
 * The rule tester drives the runner through static hooks rather than through an import, because it supports several
 * runners. Registering them once, before any test file builds a tester, is what this file is for.
 */
RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only
