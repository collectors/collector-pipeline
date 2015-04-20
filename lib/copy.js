'use strict'

/**
 * Copy all the S3 files with a prefix into Redshift.
 * Expects you to have a JSON paths file at `:schema/:event/paths.json`
 */

const pg = require('pg-then')

const config = require('..')

const pool = pg.Pool(config.redshift_uri)

module.exports = Copy

function Copy(schema, event, key_prefix) {
  // always add a `/` suffix to the prefix
  // so that dates aren't messed up
  if (!/\/$/.test(key_prefix)) key_prefix += '/'

  return pool.query(`
    COPY ${schema}.${event}
    FROM 's3://${config.bucket}/${schema}/${event}/${key_prefix}'
    JSON AS 's3://${config.bucket}/${schema}/${event}/paths.json'
    WITH CREDENTIALS AS 'aws_access_key_id=${config.key};aws_secret_access_key=${config.secret}'
    GZIP
    DATEFORMAT AS 'auto'
    TIMEFORMAT AS 'epochmillisecs'
    TRIMBLANKS
    EMPTYASNULL
    BLANKSASNULL
  `)
}
