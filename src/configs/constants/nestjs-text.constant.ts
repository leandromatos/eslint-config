import type { StringPattern, TextOptions } from '../../plugins/text/types/index.js'

/** A period closing the string. */
export const PERIOD = '\\.$'

/** A period closing the string, or one opening a second sentence. `job.id` and `v1.2` are neither. */
export const NO_PERIOD = '\\.$|\\. [A-Z]'

/** The decorators that document a field, which carry the same description rules. */
const FIELD_DECORATORS = ['ApiProperty', 'ApiPropertyOptional']

/** The exception classes whose title is a sentence and nothing more. */
const PLAIN_EXCEPTIONS = ['new BadRequestException', 'new UnauthorizedException', 'new ForbiddenException']

/** The decorators that document a success response. */
const SUCCESS_RESPONSES = ['ApiOkResponse', 'ApiCreatedResponse', 'ApiNoContentResponse']

/** The methods of the framework's logger. */
const LOG_METHODS = ['this.logger.warn', 'this.logger.error', 'this.logger.log', 'this.logger.debug']

/** The opening phrase a field description carries, by what the field name says the field holds. */
const FIELD_PHRASES: Pick<StringPattern, 'target' | 'must' | 'because'>[] = [
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
 * The shape the package gives the strings a NestJS service ships.
 *
 * Every entry reads a call the framework or its Swagger package declares, so a project on the same stack takes them
 * as they are. What a product decides for itself, the words of its own domain, it adds by spreading this list.
 */
export const NESTJS_TEXT: TextOptions = {
  stringPatterns: [
    ...LOG_METHODS.map(callee => ({
      callee,
      mustNot: NO_PERIOD,
      because: 'a log line carries no period; a reason follows a colon',
    })),
    {
      callee: 'new NotFoundException',
      property: 'title',
      must: 'not found( in [a-z ]+)?\\.$',
      because: 'a not-found title is "{Resource} not found."',
    },
    {
      callee: 'new ConflictException',
      property: 'title',
      must: '( already .*| is not [a-z]+)\\.$',
      because:
        'a conflict title is "{Field} already exists.", "{Field} already in use." or "{Resource} is not {state}."',
    },
    {
      callee: 'new InternalServerErrorException',
      property: 'title',
      must: '^Error while .*\\.$',
      because: 'an internal error title is "Error while {action} {resource}."',
    },
    ...PLAIN_EXCEPTIONS.map(callee => ({
      callee,
      property: 'title',
      must: PERIOD,
      because: 'an exception title ends with a period',
    })),
    {
      callee: 'ApiOperation',
      property: 'summary',
      mustNot: '^(Find|Get|Fetch|List|Return|Remove) ',
      because: 'a read is "Retrieve" and a removal is "Delete": one word per concept',
    },
    {
      callee: 'ApiOperation',
      property: 'summary',
      mustNot: NO_PERIOD,
      because: 'a summary is a label, without a period',
    },
    {
      callee: 'ApiOperation',
      property: 'description',
      must: PERIOD,
      because: 'a description is a sentence, with a period',
    },
    ...SUCCESS_RESPONSES.map(callee => ({
      callee,
      property: 'description',
      mustNot: 'ha(s|ve) been successfully',
      because: 'a success response is "When the {resource} is {verb} successfully."',
    })),
    ...FIELD_DECORATORS.map(callee => ({
      callee,
      property: 'description',
      must: PERIOD,
      because: 'a description is a sentence, with a period',
    })),
    ...FIELD_PHRASES.flatMap(({ target, must, because }) =>
      FIELD_DECORATORS.map(callee => ({ callee, property: 'description', target, must, because })),
    ),
  ],
}
