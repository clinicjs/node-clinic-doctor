'use strict'

const summary = require('summary')
const distributions = require('distributions')

function analyseHandles (processStatSubset, traceEventSubset) {
  // Healthy handle graphs tends to grow or shrink in small steps.
  //
  // handles
  // |   ^   ^         /^^
  // |  / \ / \   /\  /   \
  // | /       \^/  \/     \
  // ------------------------ time
  //
  // Unhealthy handles graphs increase and makes large drop
  //
  // handles
  // |   ^^^   /^^^     /^^^
  // |  /  |  /    |   /
  // | /   |^^     |^^^
  // ------------------------ time
  //
  // A heuristic statistical description of such a behaviour, is that
  // healthy handle graphs are essentially random walks on a symmetric
  // distribution.
  // To test this, perform a sign change test on the differential.
  const handles = processStatSubset.map((d) => d.handles)

  // Check for stochasticity, otherwise the following is mathematical nonsense.
  if (summary(handles).sd() === 0) {
    return false
  }

  // 1. Assuming handles is a random-walk process, then calculate the first
  // order auto-diffrential to get the white-noise.
  // 2. Reduce the dataset to those values where the value did change, this
  // is to avoid over-sampling and ignore constant-periods.
  const noise = nonzero(diff(handles))

  // Count the number of sign changes
  const numSignChanges = nonzero(diff(sign(noise))).length

  // Sign changes on a symmetric distribution will follow a binomial distribution
  // where the probability of sign change equals 0.5. Thus, perform a binomial
  // test with the null hypothesis `probability >= 0.5`.
  // Note that we don't use a two-sided test because:
  // 1. It is apparently expensive and complicated to implement.
  //    See: https://github.com/scipy/scipy/blob/master/scipy/stats/morestats.py
  //         look for `binom_test`
  // 2. We currently have don't understand of what a consistent sign change
  //    indicates. Thus we will treat `probability > 0.5` as being fine.
  const binomial = new distributions.Binomial(0.5, noise.length)
  const pvalue = binomial.cdf(numSignChanges)

  // If is is very unlikely that the sign change probability is greater than
  // 0.5, then we likely have an issue with the handles.
  const alpha = 1e-7 // risk acceptance
  return pvalue < alpha
}

module.exports = analyseHandles

function diff (vec) {
  const changes = []
  let last = vec[0]
  for (let i = 1; i < vec.length; i++) {
    changes.push(vec[i] - last)
    last = vec[i]
  }
  return changes
}

function sign (vec) {
  return vec.map(Math.sign)
}

function nonzero (vec) {
  return vec.filter((v) => v !== 0)
}
