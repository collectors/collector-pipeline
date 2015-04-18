'use strict'

// collector-json
exports.key = 'acid'
exports.length = 16
exports.maxAge = 365 * 24 * 60 * 60 * 1000
exports.trust = function () {
  return true
}
exports.headers = [
  'user-agent',
]

// s3-buffer-stream options
exports.key = process.env.AWS_ACCESS_KEY_ID
exports.secret = process.env.AWS_SECRET_ACCESS_KEY
exports.bucket = process.env.BUCKET

// redshift URI
exports.redshift_uri = process.env.REDSHIFT_URI

// interval between flushes
exports.interval = 60 * 1000

// list of supported events
const events = exports.events = new Set()

events.add('identify')
events.add('page')
events.add('impression')
events.add('first_quartile')
events.add('midpoint')
events.add('third_quartile')
events.add('complete')
events.add('interaction')
events.add('clickthrough')

exports.createS3Key = function (event) {
  const now = new Date()
  return [
    event,
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
  ].join('/') + random() + '.json'
}

exports.onFlush = function (key) {
  console.log('saved: ' + key)
}

exports.onError = function (err) {
  console.error(err.stack)
}

function random() {
  return Math.random().toString(36).slice(2)
}
