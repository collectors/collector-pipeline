'use strict'

/**
 * Copy all the S3 files with a prefix into Redshift.
 */

const pg = require('pg')

const config = require('..')

module.exports = Copy

function Copy(schema, event, key_prefix) {
  // always add a `/` suffix to the prefix
  // so that dates aren't messed up
  if (!/\/$/.test(key_prefix)) key_prefix += '/'

  return query(`
    COPY ${schema}.${event}
    FROM 's3://${config.bucket}/${schema}/${event}/${key_prefix}'
    JSON AS 's3://${config.bucket}/${schema}/${event}/path.json'
    WITH CREDENTIALS AS 'aws_access_key_id=${config.key};aws_secret_access_key=${config.secret}'
    GZIP
    DATEFORMAT AS 'auto'
    TIMEFORMAT AS 'epochmillisecs'
    TRIMBLANKS
    EMPTYASNULL
    BLANKSASNULL
  `)
}

function query(string) {
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
