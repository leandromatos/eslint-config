const { join } = require('node:path')

module.exports.resolveManifest = root => join(root, 'package.json')
