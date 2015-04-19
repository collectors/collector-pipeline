'use strict'

/**
 * HTTP -> Environment Streams
 */

const Writable = require('stream').Writable
const inherits = require('util').inherits
const uid = require('uid-safe')
const IP = require('ip')

const buffers = require('./buffers')
const config = require('../config')

const environments = config.environments
const events = config.events

// writer
inherits(Writer, Writable)
function Writer(schema) {
  if (!(this instanceof Writer)) return new Writer(schema)

  this.schema = schema
  Writable.call(this, {
    objectMode: true,
  })
}

Writer.prototype._write = function (obj, NULL, cb) {
  // ignore invalid events
  // supporting arbitrary events might lead to leaks
  const event = obj.data && obj.data.event
  if (!event || !events.has(event)) return cb()

  // add a unique event id
  obj.id = uid.sync(16)

  // format ip address
  formatIPAddress(obj)
  // format objects
  formatObject(obj)

  // write to the appropriate stream
  buffers.get(this.schema + ';' + event).write(JSON.stringify(obj))

  cb()
}

// environment -> writer
const writers = module.exports = new Map()
for (let env of environments.keys()) {
  writers.set(env, new Writer(environments.get(env)))
}

// convert the ip to a 128-bit hex
// because redshift doesn't support network addresses
// or binaryd ata
function formatIPAddress(obj) {
  if (!obj.ip) return
  let ip = IP.toBuffer(obj.ip)
  if (ip.length === 4) {
    let buf = new Buffer(12)
    buf.fill(0)
    obj.ip = Buffer.concat([buf, ip]).toString('hex')
  } else if (ip.length === 16) {
    obj.ip = ip.toString('hex')
  } else {
    delete obj.ip
    console.error('Invalid IP address: ' + ip)
    console.error(obj)
  }
}

function formatObject(obj) {
  if (!obj) return obj
  // convert all dates to milliseconds
  if (obj instanceof Date) return obj.getTime()
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(formatObject)
  for (let key of Object.keys(obj)) {
    obj[key] = formatObject(obj[key])
  }
  return obj
}
