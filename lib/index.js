'use strict'

const BufferStream = require('s3-buffer-stream')
const Writable = require('stream').Writable
const Collector = require('collector-json')
const uid = require('uid-safe')
const IP = require('ip')

const config = require('./config')

module.exports = onRequest

const collector = Collector(config)
const fn = collector.callback()
const events = config.events

collector.stream
.on('error', config.onError)
.pipe(Writable({
  objectMode: true,
  write: function (obj, NULL, cb) {
    const event = obj.data && obj.data.event
    if (!event || !events.has(event)) return cb()

    // convert the ip to a 128-bit hex
    if (obj.ip) {
      let ip = IP.toBuffer(obj.ip)
      if (ip.length === 4) {
        let buf = new Buffer(12)
        buf.fill(0)
        ip = Buffer.concat(buf, ip)
      }
      if (ip.length !== 16) {
        console.error('Invalid IP address: ' + ip)
        console.error(obj)
        cb()
        return
      }
      obj.ip = ip.toString('hex')
    }

    // add a unique event id
    obj.id = uid.sync(16)

    // convert all dates to milliseconds
    traverseDateToMilliseconds(obj)

    this.push(obj)
    cb()
  },
}))
.on('error', config.onError)

// initialize writable streams
const streams = new Map()
for (let event of events) create(event)

// only support the /track route
function onRequest(req, res) {
  if (req.url !== '/track') {
    res.statusCode = 404
    res.end()
    return
  }

  fn(req, res)
}

// flush a single event stream
onRequest.flush = flush
function flush(event) {
  const stream = streams.has(event)
  if (!stream.length) return Promise.resolve(false)
  const key = config.createS3Key(event)
  create(event)
  return stream.send(key)
}

// overwrite an event
onRequest.create = create
function create(event) {
  streams.set(event, new BufferStream(config).on('error', config.onError))
}

// flush all sequentially
onRequest.flushSequential = flushSequential
function flushSequential() {
  const keys = events.keys()
  let i = 0
  return next()

  function next() {
    if (i === keys.length) return Promise.resolve()
    return flush(keys[i++])
  }
}

// flush all in parallel
onRequest.flushAll = flushAll
function flushAll() {
  return Promise.all(events.keys().map(flush))
}

// flush all on an interval
onRequest.flushNext = flushNext
function flushNext() {
  delete onRequest.intervalId
  return flushSequential().then(function () {
    return new Promise(function (resolve) {
      onRequest.intervalId = setTimeout(resolve, config.interval)
    }).then(flushNext)
  })
}

function traverseDateToMilliseconds(obj) {
  if (!obj) return obj
  if (obj instanceof Date) return obj.getTime()
  if (Array.isArray(obj)) return obj.map(traverseDateToMilliseconds)
  for (let key of Object.keys(obj)) {
    obj[key] = traverseDateToMilliseconds(obj[key])
  }
  return obj
}

// always flush all streams before exiting
require('exit-then').push(flushAll)
