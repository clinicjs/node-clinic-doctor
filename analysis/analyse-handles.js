'use strict'

const summary = require('summary')
const distributions = require('distributions')

function analyseHandles (data) {
  const handles = data.map((d) => d.handles)
  const stats = summary(handles)
  const studentt = new distributions.Studentt(stats.size() - 1)

  // if there is no variation, the remaning code is statistically going to
  // be nonsense. But if there is no variation, then it is quite unlikely
  // there is an I/O issue.
  if (stats.sd() === 0) return false

  // calculate 5% confidence interval
  const multiplier = studentt.inv(0.975) // 1 - 5%/2
  const lowerConfidenceBound = stats.mean() - multiplier * stats.sd()
  const upperConfidenceBound = stats.mean() + multiplier * stats.sd()

  // count the number of observations outside the confidence interval
  let below = 0
  let above = 0
  for (let i = 0; i < handles.length; i++) {
    if (handles[i] < lowerConfidenceBound) below += 1
    else if (handles[i] > upperConfidenceBound) above += 1
  }
  const belowRatio = below / stats.size()
  const aboveRatio = above / stats.size()

  // We should expect 2.5% to be on either side of the confidence interval,
  // to allow for some error, set the limit to 5%.
  // This assumes the data is normally distributed. If the data is not normally
  // distributed the distribution will typically be skewed, thus more
  // observation will be seen on one of the extream sides. This kind of
  // distribution is also an indicator of something being odd.
  return belowRatio < 0.05 || aboveRatio > 0.05
}

module.exports = analyseHandles
