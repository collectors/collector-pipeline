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
})
