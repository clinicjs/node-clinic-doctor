const semver = require('semver')

function isOneOfNodeVersions (versions) {
  return versions.some(version => semver.satisfies(process.version, version))
}

module.exports = isOneOfNodeVersions
