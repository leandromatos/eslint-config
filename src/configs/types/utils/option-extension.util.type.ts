/**
 * A list as a project passes it: items that join the default, or a function that receives the default and answers
 * the whole list.
 *
 * An array is the common case and it only adds, so a project never retypes a default to append one entry. The
 * function is what removes or reorders one.
 */
export type ListExtension<TItem> = readonly TItem[] | ((defaults: TItem[]) => TItem[])

/**
 * A map as a project passes it: entries that join the default, where a key the default carries is replaced, or a
 * function that receives the default and answers the whole map.
 */
export type MapExtension<TValue> =
  Readonly<Record<string, TValue>> | ((defaults: Record<string, TValue>) => Record<string, TValue>)

/** One field of a group as a project passes it: a list or a map extends the default, and anything else replaces it. */
export type FieldExtension<TField> = TField extends readonly (infer TItem)[]
  ? ListExtension<TItem>
  : TField extends Record<string, infer TValue>
    ? MapExtension<TValue>
    : TField

/**
 * A group of options as a project passes it: every field optional, and every list and every map extending the default.
 */
export type GroupExtension<TGroup> = { [TKey in keyof TGroup]?: FieldExtension<NonNullable<TGroup[TKey]>> }
