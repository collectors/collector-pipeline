'use strict'

const toArray = require('iterator-to-array')
const Collector = require('collector-json')

const writers = require('./writers')
const config = require('../config')

module.exports = onRequest

// map of environments -> collector fn
// also, setup the writers
const collectors = onRequest.collectors = new Map()
for (let env of config.environments.keys()) {
  let collector = Collector(config)
  collector.stream
  .on('error', config.onError)
  .pipe(writers.get(env))
  collectors.set(env, collector)
}

// regular for route matching
// POST /:environment/track
const re = new RegExp('^\\/'
  + '(' + toArray(config.environments.keys()).join('|') + ')'
  + '\\/track$')

function onRequest(req, res) {
  const match = re.exec(req.url)
  if (!match) {
    res.statusCode = 404
    res.end()
    return
  }

  collectors.get(match[1]).call(null, req, res)
}
