# node-clinic-doctor
[![npm version][2]][3] [![build status][4]][5]
[![downloads][8]][9] [![js-standard-style][10]][11]

Programmable interface to [clinic][12] doctor

## Example

```js
const ClinicDoctor = require('clinic-doctor')
const doctor = new ClinicDoctor()

doctor.collect(['node', './path-to-script.js'], function (err, filepath) {
  if (err) throw err

  doctor.visualize(filepath, filepath + '.html', function (err) {
    if (err) throw err
  });
})
```

## Documentation

```js
const ClinicDoctor = require('clinic-doctor')
const doctor = new ClinicDoctor()
```

#### `doctor.collect(args, callback)`

Starts a process by using:
```js
const { spawn } = require('child_process')
spawn(args[0], ['-r', 'sampler.js'].concat(args.slice(1)))
```

The injected sampler will produce a file in the current working directory, with the process PID in its filename. The filepath relative to the current working directory will be the value in the callback.

stdout, stderr, and stdin will be relayed to the calling process. As will the `SIGINT` event.

#### `doctor.visualize(dataFilename, outputFilename, callback)`

Will consume the datafile specified by `dataFilename`, this datafile will be produced by the sampler using `doctor.collect`.

`doctor.visualize` will then output a standalone HTML file to `outputFilename`. When completed the `callback` will be called with no extra arguments, except a possible error.

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/node-clinic-doctor.svg?style=flat-square
[3]: https://npmjs.org/package/node-clinic-doctor
[4]: https://img.shields.io/travis/nearform/node-clinic-doctor/master.svg?style=flat-square
[5]: https://travis-ci.org/nearform/node-clinic-doctor
[6]: https://img.shields.io/codecov/c/github/nearform/node-clinic-doctor/master.svg?style=flat-square
[7]: https://codecov.io/github/nearform/node-clinic-doctor
[8]: http://img.shields.io/npm/dm/node-clinic-doctor.svg?style=flat-square
[9]: https://npmjs.org/package/node-clinic-doctor
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
[12]: https://github.com/nearform/node-clinic
