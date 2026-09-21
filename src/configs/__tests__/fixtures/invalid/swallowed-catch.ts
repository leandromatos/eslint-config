export const verify = async (check: () => Promise<boolean>): Promise<boolean | null> => check().catch(() => null)
