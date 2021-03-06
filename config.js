'use strict'

// collector-json
exports.key = 'acid'
exports.length = 16
exports.maxAge = 365 * 24 * 60 * 60 * 1000

// trust for X-Forwarded-For header
exports.trust = function () {
  return true
}

// s3-buffer-stream options
exports.key = process.env.COLLECTOR_PIPELINE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
exports.secret = process.env.COLLECTOR_PIPELINE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
exports.bucket = process.env.COLLECTOR_PIPELINE_BUCKET || process.env.BUCKET

// redshift URI
exports.redshift_uri = process.env.REDSHIFT_URI

// interval between flushes
exports.interval = parseInt(process.env.COLLECTOR_PIPELINE_INTERVAL || 60 * 1000)

// list of supported events
const events = exports.events = new Set()

// some generic analytics events
events.add('identify')
events.add('page')
events.add('impression')
events.add('first_quartile')
events.add('midpoint')
events.add('third_quartile')
events.add('complete')
events.add('interaction')
events.add('clickthrough')

// write key -> redshift schema map
const environments = exports.environments = new Map()
environments.set('dev', 'dev') // local dev
environments.set('test', 'test') // CI testing
environments.set('staging', 'staging') // staging server
environments.set('production', 'production') // production

// store data to S3 with this key
// NOTE: should we store each fragment w/ a consistent size?
exports.createS3Key = function (schema, event) {
  const now = new Date()
  return [
    schema,
    event,
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
  ].join('/') + random() + '.json'
}

// log or store keys that are written
exports.onFlush = function (schema, event, key) {
  console.log('saved: s3://:bucket/%s', key)
}

// log any errors that occur
/* istanbul ignore next */
exports.onError = function (err) {
  console.error(err.stack)
}

function random() {
  return Math.random().toString(36).slice(2)
}
