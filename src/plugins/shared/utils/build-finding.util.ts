import type { Finding } from '../types/index.js'

/**
 * Builds what a judge reports for one problem of a file.
 *
 * @param messageId - Which message the rule reports.
 * @param messageValues - What the message is filled with.
 * @returns The finding.
 */
export const buildFinding = <TMessageId extends string>(
  messageId: TMessageId,
  messageValues: Record<string, string>,
): Finding<TMessageId> => ({ messageId, messageValues })
