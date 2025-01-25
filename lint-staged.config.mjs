/**
 * @type {import('lint-staged').Config}
 */
export default {
  '*.ts': () => 'yarn lint',
}
