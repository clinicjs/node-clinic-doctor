'use strict'

const summary = require('summary')
const distributions = require('distributions')

function performanceIssue (issue) {
  return issue ? 'performance' : 'none'
}

function whiteNoiseSignTest (noise) {
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

  return pvalue
}

// Implementation of the mira skrewness tests
// Paper:
//   Title: Distribution-free test for symmetry based on Bonferroni's Measure
//   Link: https://www.researchgate.net/publication/2783935
function miraSkewnessTest (handleStat, handles) {
  const c = 0.5 // Distribution dependent constant, 0.5 is the best value for unknown distribution
  const n = handleStat.size()
  const median = handleStat.median()

  // Compute the bonferroni measure
  const bonferroni = 2 * (handleStat.mean() - median)

  // Compute the variance for the sqrt(n) * bonferroni measure
  const medianAbsoluteDeviation = summary(handles.map((x) => Math.abs(x - median))).mean()
  const densityInverse = (Math.pow(n, 1 / 5) / (2 * c)) * (
    handleStat.quartile(1 / 2 + 0.5 * Math.pow(n, -1 / 5)) -
    handleStat.quartile(1 / 2 - 0.5 * Math.pow(n, -1 / 5) + 1 / n)
  )
  const bonferroniVariance = 4 * handleStat.variance() +
                             densityInverse * densityInverse -
                             4 * densityInverse * medianAbsoluteDeviation

  // Compute Z statistics
  const Z = Math.sqrt(n) * bonferroni / Math.sqrt(bonferroniVariance)

  // Compute two-sided p-value
  const normal = new distributions.Normal()
  const pvalue = 2 * (1 - normal.cdf(Math.abs(Z)))

  return pvalue
}

function analyseHandles (systemInfo, processStatSubset, traceEventSubset) {
  // Healthy handle graphs tends to grow or shrink in small steps.
  //
  // handles
  // |   ^   ^         /^^
  // |  / \ / \   /\  /   \
  // | /       \^/  \/     \
  // ------------------------ time
  //
  // Unhealthy handles graphs increase and makes large drop (sawtooth pattern)
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
  const handleStat = summary(handles)
  if (handles.length < 2) {
    return 'data'
  }

  // Check for stochasticity, otherwise the following is mathematical nonsense.
  if (handleStat.sd() === 0) {
    return 'none'
  }

  // 1. Assuming handles is a random-walk process, then calculate the first
  // order auto-diffrential to get the white-noise.
  // 2. Reduce the dataset to those values where the value did change, this
  // is to avoid over-sampling and ignore constant-periods.
  // NOTE: since sd() !== 0, noise is guaranteed to have some data
  const noise = nonzero(diff(handles))

  // Perform a sign test on the assumed-noise.
  // This is to test the sawtooth pattern.
  const signAlpha = 1e-7 // risk acceptance
  const signPvalue = whiteNoiseSignTest(noise)
  const signIssueDetected = signPvalue < signAlpha

  // Perform a two-sided mira-skewness-test.
  // This is to test an increasing function, that eventually flattens out
  const miraAlpha = 1e-10 // risk acceptance
  const miraPvalue = miraSkewnessTest(handleStat, handles)
  const miraIssueDetected = miraPvalue < miraAlpha

  return performanceIssue(signIssueDetected || miraIssueDetected)
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
