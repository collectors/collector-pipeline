'use strict'

const pg = require('pg')

const config = require('..')

module.exports = Copy

function Copy(event, key_prefix) {
  if (!/\/$/.test(key_prefix)) key_prefix += '/'
  const string = `
    COPY ${event}
    FROM 's3://${config.bucket}/${event}/${key_prefix}'
    JSON AS 's3://${config.bucket}/${event}/path.json'
    WITH CREDENTIALS AS 'aws_access_key_id=${config.key};aws_secret_access_key=${config.secret}'
    GZIP
    DATEFORMAT AS 'auto'
    TIMEFORMAT AS 'epochmillisecs'
    TRIMBLANKS
    EMPTYASNULL
    BLANKSASNULL
  `

  return new Promise(function (resolve, reject) {
    pg.connect(config.redshift_uri, function (err, client, done) {
      if (err) return reject(err)

      client.query(string, function (err, result) {
        done()

        if (err) return reject(err)
        resolve()
      })
    })
  })
}
