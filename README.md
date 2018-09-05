# node-clinic-doctor

[![Greenkeeper badge](https://badges.greenkeeper.io/nearform/node-clinic-doctor.svg)](https://greenkeeper.io/)
[![npm version][npm-version]][npm-url] [![Stability Stable][stability-stable]][stability-docs] [![CircleCI build status][circleci-status]][circleci-url] [![Appveyor build status][appveyor-status]][appveyor-url]
[![Downloads][npm-downloads]][npm-url] [![Code style][lint-standard]][lint-standard-url]

Programmable interface to [clinic][clinic-url] doctor. Learn more about clinic: https://clinicjs.org/

![banner](logo.png)

## Supported node versions

* Node.js 10.0.0 and above
* Node.js 9.4.0 and above
* Node.js 8.10.0 and above

Node.js 8.9.4 also works, however you have to listen to `SIGINT` and shutdown
the process nicely.

## Example

```js
const ClinicDoctor = require('@nearform/doctor')
const doctor = new ClinicDoctor()

doctor.collect(['node', './path-to-script.js'], function (err, filepath) {
  if (err) throw err

  doctor.visualize(filepath, filepath + '.html', function (err) {
    if (err) throw err
  });
})
```

You can find examples in
[node-clinic-doctor-examples](https://github.com/nearform/node-clinic-doctor-examples)

## Documentation

```js
const ClinicDoctor = require('@nearform/doctor')
const doctor = new ClinicDoctor()
```

### new ClinicDoctor([settings])

* settings [`<Object>`][]
  * sampleInterval [`<number>`][] Time between each sample in milliseconds.
    **Default**: 10
  * detectPort [`<boolean>`][] **Default**: false
  * debug [`<boolean>`][] If set to true, the generated html will not be minified.
    **Default**: false

#### `doctor.collect(args, callback)`

Starts a process by using:

```js
const { spawn } = require('child_process')
spawn(args[0], ['-r', 'sampler.js'].concat(args.slice(1)))
```

The injected sampler will produce a file in the current working directory, with
the process PID in its filename. The filepath relative to the current working
directory will be the value in the callback.

stdout, stderr, and stdin will be relayed to the calling process. As will the
`SIGINT` event.

#### `doctor.visualize(dataFilename, outputFilename, callback)`

Will consume the datafile specified by `dataFilename`, this datafile will be
produced by the sampler using `doctor.collect`.

`doctor.visualize` will then output a standalone HTML file to `outputFilename`.
When completed the `callback` will be called with no extra arguments, except a
possible error.

## License
[GPL 3.0](LICENSE)

[stability-stable]: https://img.shields.io/badge/stability-stable-green.svg?style=flat-square
[stability-docs]: https://nodejs.org/api/documentation.html#documentation_stability_index
[npm-version]: https://img.shields.io/npm/v/@nearform/clinic-doctor.svg?style=flat-square
[npm-url]: https://www.npmjs.org/@nearform/clinic-doctor
[circleci-status]: https://circleci.com/gh/nearform/node-clinic-doctor/tree/master.svg?style=shield&circle-token=c26d5926558ff909ef0384756c3b70bc6151866e
[circleci-url]: https://circleci.com/gh/nearform/node-clinic-doctor
[npm-downloads]: http://img.shields.io/npm/dm/@nearform/clinic-doctor.svg?style=flat-square
[lint-standard]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[lint-standard-url]: https://github.com/feross/standard
[clinic-url]: https://github.com/nearform/node-clinic
[appveyor-status]: https://ci.appveyor.com/api/projects/status/xxijxjm3fhwhb5x6?svg=true
[appveyor-url]: https://ci.appveyor.com/project/nearForm/node-clinic-doctor
[`<Object>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[`<boolean>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type
[`<number>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
