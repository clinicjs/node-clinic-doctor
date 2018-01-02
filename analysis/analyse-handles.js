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
  // healthy handle graphs are esentially random walks on a symetric
  // distribution.
  // To test this, perform a sign change test on the differential.
  const handles = processStatSubset.map((d) => d.handles)

  // check for stochasticity, otherwise the following is mathmatical nosense.
  if (summary(handles).sd() === 0) {
    return false
  }

  // Calculate the changes in handles (differential)
  const changes = diff(handles)
  // Determin if the change was an increase or a decrease
  const direction = changes.map(Math.sign)
  const notConstant = direction.map((v) => v !== 0)
  // Count the number of sign changes
  const signChanges = diff(direction).map((v) => v !== 0)
  const numSignChanges = summary(signChanges).sum()

  // In cases where the number of handles is somewhat constant, it looks
  // like there are unsually few sign changes. But this is actually fine if
  // the server doesn't do anything asynchronously at all. To not see this
  // as a handle issue, compare not the number of sign changes with
  // `processStatSubset.length` but instead with the number of observations
  // where changes were observed.
  // There can be an off-by-one error were there are more sign changes than
  // non constant observations. Simply round the number of non constant
  // observations up to fit.
  const numNotConstant = Math.max(numSignChanges, summary(notConstant).sum())

  // Sign changes on a symetric distribution will follow a binomial distribution
  // where the properbility of sign change equals 0.5. Thus, perform a binomial
  // test with the null hypothesis `properbility >= 0.5`.
  // Note that we don't use a two-sided test because:
  // 1. It is apparently expensive and complicated to implement.
  //    See: https://github.com/scipy/scipy/blob/master/scipy/stats/morestats.py
  //         look for `binom_test`
  // 2. We currently have don't understand of what a consistent sign change
  //    indicates. Thus we will treat `properbility > 0.5` as being fine.
  const binomial = new distributions.Binomial(0.5, numNotConstant)
  const pvalue = binomial.cdf(numSignChanges)

  // If is is very unlikely that the sign change properbility is greater than
  // 0.5, then we likely have an issue with the handles.
  const alpha = 0.001 // risk acceptance
  return pvalue < alpha
}

module.exports = analyseHandles

function diff (handles) {
  const changes = []
  let lastHandles = handles[0]
  for (let i = 1; i < handles.length; i++) {
    changes.push(handles[i] - lastHandles)
    lastHandles = handles[i]
  }
  return changes
}
