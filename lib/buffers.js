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
const combinations = streams.combinations = []
for (let schema of environments.values()) {
  for (let event of events) {
    combinations.push([schema, event])
    create(schema, event)
  }
}

// initialize flushing interval
flushNext()

// handle on-exit logic
require('exit-then').push(function () {
  if (exports.intervalId) clearTimeout(exports.intervalId)
  exports.exiting = true
  return Promise.resolve(exports.flushSequentialPromise).then(flushParallel)
})

// flush all streams sequentially
// useful for throttling requests
streams.flushSequential = flushSequential
function flushSequential() {
  let i = 0
  return next()
  function next() {
    // done
    if (combinations.length === i) return Promise.resolve()
    return flush(combinations[i++]).catch(config.onError).then(next)
  }
}

// flush all streams in parallel
// useful when the system is about to shut down
streams.flushParallel = flushParallel
function flushParallel() {
  return Promise.all(combinations.map(flush))
}

// flush sequentially with an interval in between
function flushNext() {
  delete exports.intervalId
  if (exports.exiting) return Promise.resolve()
  const promise = exports.flushSequentialPromise = flushSequential().catch(config.onError)
  return promise.then(timeout).then(flushNext)
}

function timeout() {
  return new Promise(function (resolve) {
    delete exports.flushSequentialPromise
    exports.intervalId = setTimeout(resolve, config.interval)
  })
}

// create a new stream
function create(schema, event) {
  streams.set(schema + ';' + event, new BufferStream(config)
  .on('error', config.onError))
}

// flush a single stream
streams.flush = flush
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
  return stream.send(key).then(function (key) {
    config.onFlush(schema, event, key)
    return key
  })
}
