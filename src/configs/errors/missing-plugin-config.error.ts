/** Thrown when a plugin this package builds on no longer declares a configuration the package asks it for by name. */
export class MissingPluginConfigError extends Error {
  /**
   * Builds the error from the plugin and the configuration it lacks.
   *
   * @param pluginName - The package of the plugin.
   * @param configName - The configuration the package asked it for.
   */
  constructor(
    readonly pluginName: string,
    readonly configName: string,
  ) {
    super(`${pluginName} declares no flat configuration named "${configName}".`)
    this.name = 'MissingPluginConfigError'
  }
}
