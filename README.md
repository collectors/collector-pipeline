
# collector-pipeline

[![Latest tag][github-tag]][github-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]

Experimental data pipeline.

1. POST `/:environment/track`
2. Format data
3. Buffer to the local file system
4. POST to S3
5. Copy into Amazon Redshift

[npm-image]: https://img.shields.io/npm/v/collector-pipeline.svg?style=flat-square
[npm-url]: https://npmjs.org/package/collector-pipeline
[github-tag]: http://img.shields.io/github/tag/collectors/collector-pipeline.svg?style=flat-square
[github-url]: https://github.com/collectors/collector-pipeline/tags
[travis-image]: https://img.shields.io/travis/collectors/collector-pipeline.svg?style=flat-square
[travis-url]: https://travis-ci.org/collectors/collector-pipeline
[coveralls-image]: https://img.shields.io/coveralls/collectors/collector-pipeline.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/collectors/collector-pipeline
[david-image]: http://img.shields.io/david/collectors/collector-pipeline.svg?style=flat-square
[david-url]: https://david-dm.org/collectors/collector-pipeline
[license-image]: http://img.shields.io/npm/l/collector-pipeline.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/collector-pipeline.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/collector-pipeline
