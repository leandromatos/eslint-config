import type { ForbiddenWord } from '../../plugins/naming/types/index.js'
import type { StringPattern } from '../../plugins/text/types/index.js'
import type { ThrowsCondition } from '../../plugins/tsdoc/types/index.js'
import type { Preset } from '../types/index.js'
import { NO_PERIOD, PERIOD } from './text.constant.js'

/** The properties of an exception and of a Swagger decorator that carry the text a pattern judges. */
export const CONTROLLED_LANGUAGE_PROPERTY = {
  description: 'description',
  summary: 'summary',
  title: 'title',
}

/** The decorator that documents an operation, whose summary and description are judged apart. */
export const CONTROLLED_LANGUAGE_OPERATION_DECORATOR = 'ApiOperation'

/** Why a description ends with a period, wherever a description is written. */
export const CONTROLLED_LANGUAGE_DESCRIPTION_REASON = 'a description is a sentence, with a period'

/** The decorators that document a field, which carry the same description rules. */
export const CONTROLLED_LANGUAGE_FIELD_DECORATORS = ['ApiProperty', 'ApiPropertyOptional']

/** The exception classes whose title is a sentence and nothing more. */
export const CONTROLLED_LANGUAGE_PLAIN_EXCEPTIONS = [
  'new BadRequestException',
  'new UnauthorizedException',
  'new ForbiddenException',
]

/** The decorators that document a success response. */
export const CONTROLLED_LANGUAGE_SUCCESS_RESPONSES = ['ApiOkResponse', 'ApiCreatedResponse', 'ApiNoContentResponse']

/** The methods of the framework's logger, under the property the services of the house inject it as. */
export const CONTROLLED_LANGUAGE_LOG_METHODS = [
  'this.logger.warn',
  'this.logger.error',
  'this.logger.log',
  'this.logger.debug',
]

/** The opening phrase a field description carries, by what the field name says the field holds. */
export const CONTROLLED_LANGUAGE_FIELD_PHRASES: Pick<StringPattern, 'target' | 'must' | 'because'>[] = [
  {
    target: '^id$',
    must: '^The unique identifier of the ',
    because: 'an ID is "The unique identifier of the {resource}."',
  },
  { target: '^is[A-Z]', must: '^Indicates whether ', because: 'a boolean is "Indicates whether {condition}."' },
  {
    target: '[a-z]At$',
    must: '^The timestamp when the ',
    because: 'a timestamp is "The timestamp when the {resource} was {action}."',
  },
  {
    target: '[a-z]Id$',
    must: '^The (unique identifier|ID) of the ',
    because:
      'an ID names its resource: "The unique identifier of the {resource}." or "The ID of the associated {resource}."',
  },
]

/**
 * The word no name ends with: `data` says what a value is made of rather than what it is. Inside a longer name it is
 * part of a term of the domain, as in `healthDataSharing`, so only the suffix is refused.
 */
export const CONTROLLED_LANGUAGE_FORBIDDEN_WORDS: ForbiddenWord[] = [
  { word: 'data', because: 'it says what the value is made of rather than what it is', position: 'last' },
]

/** The column `@leandromatos/prettier-config` wraps code at, which a comment wraps at too. */
export const CONTROLLED_LANGUAGE_COMMENT_WIDTH = 120

/** How the fix of `throws-tag` words the condition of an internal error: `Error while X.` reads `When X fails.` */
export const CONTROLLED_LANGUAGE_THROWS_CONDITIONS: ThrowsCondition[] = [
  { title: '^Error while (.+)\\.$', condition: 'When $1 fails.' },
]

/** The property of the problem details an exception is built with that carries its title. */
export const CONTROLLED_LANGUAGE_THROWS_TITLE_PROPERTIES = [CONTROLLED_LANGUAGE_PROPERTY.title]

/** How a NestJS service words its logs, its exception titles and its Swagger text. */
export const CONTROLLED_LANGUAGE_STRING_PATTERNS: StringPattern[] = [
  ...CONTROLLED_LANGUAGE_LOG_METHODS.map(callee => ({
    callee,
    mustNot: NO_PERIOD,
    because: 'a log line carries no period; a reason follows a colon',
  })),
  {
    callee: 'new NotFoundException',
    property: CONTROLLED_LANGUAGE_PROPERTY.title,
    must: 'not found( in [a-z ]+)?\\.$',
    because: 'a not-found title is "{Resource} not found."',
  },
  {
    callee: 'new ConflictException',
    property: CONTROLLED_LANGUAGE_PROPERTY.title,
    must: '( already .*| is not (soft )?[a-z]+)\\.$',
    because:
      'a conflict title is "{Field} already exists.", "{Field} already in use." or "{Resource} is not {state}.", with one word or "soft deleted" for the state',
  },
  {
    callee: 'new InternalServerErrorException',
    property: CONTROLLED_LANGUAGE_PROPERTY.title,
    must: '^Error while .*\\.$',
    because: 'an internal error title is "Error while {action} {resource}."',
  },
  ...CONTROLLED_LANGUAGE_PLAIN_EXCEPTIONS.map(callee => ({
    callee,
    property: CONTROLLED_LANGUAGE_PROPERTY.title,
    must: PERIOD,
    because: 'an exception title ends with a period',
  })),
  {
    callee: CONTROLLED_LANGUAGE_OPERATION_DECORATOR,
    property: CONTROLLED_LANGUAGE_PROPERTY.summary,
    mustNot: '^(Find|Get|Fetch|List|Return|Remove) ',
    because: 'a read is "Retrieve" and a removal is "Delete": one word per concept',
  },
  {
    callee: CONTROLLED_LANGUAGE_OPERATION_DECORATOR,
    property: CONTROLLED_LANGUAGE_PROPERTY.summary,
    mustNot: NO_PERIOD,
    because: 'a summary is a label, without a period',
  },
  {
    callee: CONTROLLED_LANGUAGE_OPERATION_DECORATOR,
    property: CONTROLLED_LANGUAGE_PROPERTY.description,
    must: PERIOD,
    because: CONTROLLED_LANGUAGE_DESCRIPTION_REASON,
  },
  ...CONTROLLED_LANGUAGE_SUCCESS_RESPONSES.map(callee => ({
    callee,
    property: CONTROLLED_LANGUAGE_PROPERTY.description,
    mustNot: 'ha(s|ve) been successfully',
    because: 'a success response is "When the {resource} is {verb} successfully."',
  })),
  ...CONTROLLED_LANGUAGE_FIELD_DECORATORS.map(callee => ({
    callee,
    property: CONTROLLED_LANGUAGE_PROPERTY.description,
    must: PERIOD,
    because: CONTROLLED_LANGUAGE_DESCRIPTION_REASON,
  })),
  ...CONTROLLED_LANGUAGE_FIELD_PHRASES.flatMap(({ target, must, because }) =>
    CONTROLLED_LANGUAGE_FIELD_DECORATORS.map(callee => ({
      callee,
      property: CONTROLLED_LANGUAGE_PROPERTY.description,
      target,
      must,
      because,
    })),
  ),
]

/**
 * The house voice, which a project takes on purpose rather than by its tier.
 *
 * What the controlled language and the tone of the house decide: how a NestJS service words its logs, its exception
 * titles and its Swagger text; the word no name ends with; the column `@leandromatos/prettier-config` wraps at; and how
 * the fix of `throws-tag` words the condition of an internal error. A tier applies it before the project's own
 * options, so a project keeps adding its own beside it.
 *
 * ```ts
 * configs.nestjs({ presets: [CONTROLLED_LANGUAGE] })
 * ```
 */
export const CONTROLLED_LANGUAGE: Preset = {
  naming: {
    forbiddenWords: CONTROLLED_LANGUAGE_FORBIDDEN_WORDS,
  },
  tsdoc: {
    commentWidth: CONTROLLED_LANGUAGE_COMMENT_WIDTH,
    throwsConditions: CONTROLLED_LANGUAGE_THROWS_CONDITIONS,
    throwsTitleProperties: CONTROLLED_LANGUAGE_THROWS_TITLE_PROPERTIES,
  },
  text: {
    stringPatterns: CONTROLLED_LANGUAGE_STRING_PATTERNS,
  },
}
