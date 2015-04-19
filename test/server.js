'use strict'

const request = require('supertest')
const assert = require('assert')

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
      assert.equal(doc.ip, '0000000000000000000000000a000102')
      done()
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
