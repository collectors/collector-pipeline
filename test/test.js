'use strict'

const request = require('supertest')
const assert = require('assert')
const zlib = require('mz/zlib')

const app = require('..')

describe('Collector Pipeline Server', function () {
  it('should 404 for unsupported schemas', function (done) {
    request(app)
    .post('/lkajsdflkajsdf/track')
    .send({
      event: 'hey'
    })
    .expect(404, done)
  })

  it('should 405 for unsupported methods', function (done) {
    request(app)
    .get('/dev/track')
    .send({
      event: 'hey'
    })
    .expect(405, done)
  })

  it('should grab the X-Forwarded-For IP address', function (done) {
    app.collectors.get('dev').stream.once('data', function (doc) {
      // document would have gotten mutated
      setImmediate(function () {
        assert.equal(doc.ip, '0000000000000000000000000a000102')
        done()
      })
    })

    request(app)
    .post('/dev/track')
    .set('X-Forwarded-For', '10.0.1.2')
    .send({
      event: 'impression'
    })
    .expect(200, function (err) {
      if (err) return done(err)
    })
  })
})

describe('Buffers', function () {
  const buffers = require('../lib/buffers')

  it('should flush the stream', function () {
    const stream = buffers.get('dev;impression')
    return buffers.flush('dev', 'impression').then(function (key) {
      return new Promise(function (resolve, reject) {
        stream.client.getFile(key, function (err, res) {
          if (err) return reject(err)

          assert.equal(res.statusCode, 200)
          resolve(res)
        })
      })
    }).then(function (res) {
      assert.equal(res.headers['content-type'], 'application/json; charset=UTF-8')
      assert.equal(res.headers['content-encoding'], 'gzip')
      return new Promise(function (resolve, reject) {
        let buf = []
        res.on('error', reject)
        res.on('data', function (chunk) {
          buf.push(chunk)
        })
        res.once('end', function () {
          resolve(Buffer.concat(buf))
        })
      })
    }).then(function (buf) {
      return zlib.gunzip(buf)
    }).then(function (buf) {
      const body = JSON.parse(buf.toString())
      assert(body.acid)
      assert(body.received_at)
    })
  })
})
