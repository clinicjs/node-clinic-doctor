'use strict'

const summary = require('summary')
const tf = require('@tensorflow/tfjs-core')
require('@tensorflow/tfjs-backend-cpu')
const HMM = require('hidden-markov-model-tf')
const util = require('util')

// Disable warning about that `require('@tensorflow/tfjs-node')` is
// recommended. There is no/minimal performance penalty and we avoid a
// native addon.
// NOTE: This is not a documented API.
tf.ENV.set('IS_NODE', false)

// There is no truth here. This parameter might need more tuning.
const SEPARATION_THRESHOLD = 1
/* eslint-disable no-loss-of-precision */
const HHM_SEED = 0xa74b9cbd4047b4bbe79f365a9f247886ac0a8a9c23ef8c5c45d98badb8
/* eslint-enable no-loss-of-precision */
function performanceIssue (issue) {
  return issue ? 'performance' : 'none'
}

async function analyseCPU (systemInfo, processStatSubset, traceEventSubset) {
  const cpu = processStatSubset.map((d) => d.cpu)
  const summaryAll = summary(cpu)

  // For extremely small data, this algorithm doesn't work
  if (cpu.length < 4) {
    return 'data'
  }

  // The CPU graph is typically composed of two "modes". An application mode
  // and a V8 mode. In the V8 mode, extra CPU threads are running garbage
  // collection and optimization. This causes the CPU usage for the
  // entire process, to be higher in these periods. For the analysing the
  // users application for I/O issues, the CPU usage data during the V8
  // mode is not of interest.
  //
  //     |         .--.      ..-          -.-
  // cpu |  .-  ..      . .     . -  .  .    .
  //     | .  -.  -    . . -     . -  .. -    ..
  //     +----------------------------------------
  //         app    v8  app   v8    app    v8  app
  // Unfortunately, it is quite difficult to separate out the V8 data, even
  // with the traceEvent data from V8.
  // NOTE(@AndreasMadsen): I don't entirely know why.
  //
  // Instead, the V8 mode data will be removed using a statistical approach.
  // The statistical approach is "Gausian Mixture Model" (GMM), a better model
  // would be a "Hidden Markov Model" (HMM). However, this model is a bit more
  // complex and there doesn't exists an implementation of HMM where the data
  // is continues. HMM is better because it understands that the data is a
  // time series, which GMM doesn't. There is a comparison in the docs.
  //
  const hmm = new HMM({
    states: 2,
    dimensions: 1
  })
  const data = tf.tidy(() => tf.reshape(tf.tensor1d(cpu), [1, cpu.length, 1]))

  // Attempt to reach 0.001, but accept 0.01
  const results = await hmm.fit(data, {
    tolerance: 0.001,
    seed: HHM_SEED
  })

  /* istanbul ignore if: it is not clear what causes HMM to not converge */
  if (results.tolerance >= 0.01) {
    return 'data' // has data issue
  }

  // Split data depending on the likelihood
  const group = [[], []]
  const state = await tf.tidy(() => tf.squeeze(hmm.inference(data))).data()
  for (let i = 0; i < cpu.length; i++) {
    group[state[i]].push(cpu[i])
  }
  const summary0 = summary(group[0])
  const summary1 = summary(group[1])

  // If one group is too small for a summary to be computed, just threat the
  // data as ungrouped.
  if (summary0.size() <= 1 || summary1.size() <= 1) {
    return performanceIssue(summaryAll.quartile(0.9) < 0.9)
  }

  // It is not always that there are two "modes". Determine if the groups are
  // separate by the separation coefficient.
  // https://en.wikipedia.org/wiki/Multimodal_distribution#Bimodal_separation
  const commonSd = 2 * (summary0.sd() + summary1.sd())
  const separation = (summary0.mean() - summary1.mean()) / commonSd
  // Threat the data as one "mode", if the separation coefficient is too small.
  if (Math.abs(separation) < SEPARATION_THRESHOLD) {
    return performanceIssue(summaryAll.quartile(0.9) < 0.9)
  }

  // The mode group with the highest mean is the V8 mode, the other is the
  // application mode. This is because V8 is multi-threaded, but javascript is
  // single-threaded.
  const summaryApplication = (
    summary0.mean() < summary1.mean() ? summary0 : summary1
  )

  // If the 90% quartile has less than 90% CPU load then the CPU is not
  // utilized optimally, likely because of some I/O delays. Highlight the
  // CPU curve in that case.
  return performanceIssue(summaryApplication.quartile(0.9) < 0.9)
}

// Wrap to be a callback function
module.exports = util.callbackify(analyseCPU)
module.exports[util.promisify.custom] = analyseCPU
