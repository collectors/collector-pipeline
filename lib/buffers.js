'use strict'

/**
 * Environment Stream -> Event S3 Buffer Stream -> S3
 */

const BufferStream = require('s3-buffer-stream')

const config = require('../config')

const environments = config.environments
const events = config.events

// map of schema;event -> stream
const streams = module.exports = new Map()

// initialize every stream as well as store every combination
const combinations = []
for (let schema of environments.values()) {
  for (let event of events) {
    combinations.push([schema, event])
    create(schema, event)
  }
}

// initialize flushing interval
flushNext()

// handle on-exit logic
// NOTE: this may conflict with flushNext()
require('exit-then').push(function () {
  if (exports.intervalId) clearTimeout(exports.intervalId)
  return flushParallel()
})

// flush all streams sequentially
// useful for throttling requests
function flushSequential() {
  let i = 0
  return next()
  function next() {
    // done
    if (combinations.length === i) return Promise.resolve()
    return flush(combinations[i])
  }
}

// flush all streams in parallel
// useful when the system is about to shut down
function flushParallel() {
  return Promise.all(combinations.map(flush))
}

// flush sequentially with an interval in between
function flushNext() {
  delete exports.intervalId
  return flushSequential()
  .catch(config.onError)
  .then(function () {
    return new Promise(function (resolve) {
      exports.intervalId = setTimeout(resolve, config.interval)
    })
  })
  .then(flushNext)
}

// create a new stream
function create(schema, event) {
  streams.set(schema + ';' + event, new BufferStream(config)
  .on('error', config.onError))
}

// flush a single stream
function flush(schema, event) {
  // combination support
  if (Array.isArray(schema)) {
    event = schema[1]
    schema = schema[0]
  }
  const stream = streams.get(schema + ';' + event)
  // don't save if no data was written
  if (!stream.length) return Promise.resolve(false)
  const key = config.createS3Key(schema, event)
  // replace the current stream with a new one
  // so that data isn't written while we're flushing this stream
  create(schema, event)
  return stream.send(key)
}
