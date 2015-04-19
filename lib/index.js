'use strict'

const toArray = require('iterator-to-array')
const Collector = require('collector-json')

const writers = require('./writers')
const config = require('../config')

// map of environments -> collector fn
// also, setup the writers
const collectors = new Map()
for (let env of config.environments.keys()) {
  let collector = Collector(config)
  collector.stream
  .on('error', config.onError)
  .pipe(writers.get(env))
  collectors.set(env, collector.callback())
}

// regular for route matching
// POST /:environment/track
const re = new RegExp('^\\/'
  + '(' + toArray(config.environments.keys()).join('|') + ')'
  + '\\/track$')

module.exports = onRequest
function onRequest(req, res) {
  const match = re.exec(req.url)
  if (!match) {
    res.statusCode = 404
    res.end()
    return
  }

  collectors.get(match[1])(req, res)
}
