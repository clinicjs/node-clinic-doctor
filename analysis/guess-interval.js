'use strict'

const ttest = require('ttest')
const atol = 1e-9

// The main source of handle variance should come from the middle part that
// contains the benchmark data. To bias the interval guessing, such that
// the middle part contains the most variance, its sum-squared-error (sse)
// is considered lower than the left and right parts.
const varianceBias = 0.25 // (1/2)**2

const trimTime = 100 // ms

function guessInterval (data) {
  // This function seperates handle sequence up into three partitions.
  // This is to guess the benchmarking interval, in a typical benchmark the
  // handle curve will look like:
  //
  // handles
  // |
  // |       |^^^^^|
  // |  -----|     |-----
  // ------------------------ time
  //
  // The lines can be very flat but we need to allow for some variation.
  // The problem of partition generation is thus treated as piecewise least
  // square regression problem, with unknown partitions.
  // There are no good solutions to this problem, but since it is a 1D problem
  // and we can constrain the curves to be flat. The solution can be brute
  // forced in O(n^2) time. Doing this does require an online mean variance
  // algorithm, thus the Welford algorithm is used together with an derived
  // inverse Welford algorithm.
  const left = new OnlineMeanVariance()
  const middle = new OnlineMeanVariance()
  const right = new OnlineMeanVariance()

  // For performance, restructure the data into a dense array
  const timestamps = data.map((d) => d.timestamp)
  const handles = data.map((d) => d.handles)

  // Start by assigning all observations to the middle partition, it will
  // have the interval [0, handles.length]
  for (const datum of handles) {
    middle.add(datum)
  }

  // Use the current partion, of everything being assigning to the middle
  // as the initial solution.
  let bestTotalError = middle.sse
  let bestLeftIndex = 0 // corresponds to slice(0, leftIndex)
  let bestRightIndex = handles.length // corresponds to slice(righIndex)

  // Brute force all valid combinations of leftIndex and rightIndex
  // Middle should always include at least one value, so don't scan to
  // the end but instead `handles.length - 1`.
  for (let leftIndex = -1; leftIndex < handles.length - 1; leftIndex++) {
    // set interval to [leftIndex, handles.length]
    if (leftIndex >= 0) {
      left.add(handles[leftIndex])
      middle.remove(handles[leftIndex])
    }
    right.reset()

    // try all valid rightIndex values
    // because the middle is going to mutate as we scan from the right, save
    // the middle stat for the interval [leftIndex, handles.length]
    const oldMiddleState = middle.save()
    // Middle should always include at least one value, so don't scan to
    // leftIndex but instead `leftIndex + 1`.
    for (let rightIndex = handles.length; rightIndex > leftIndex + 1; rightIndex--) {
      // set interval to [leftIndex, rightIndex]
      if (rightIndex < handles.length) {
        right.add(handles[rightIndex])
        middle.remove(handles[rightIndex])
      }

      // check for improvement, improvement must exceede the absolute tolerance
      if (middle.size >= 2 &&
          bestTotalError > left.sse + varianceBias * middle.sse + right.sse + atol &&
          statisticallyLessThan(left, middle) &&
          statisticallyLessThan(right, middle)) {
        bestTotalError = left.sse + varianceBias * middle.sse + right.sse
        bestLeftIndex = leftIndex + 1
        bestRightIndex = rightIndex
      }
    }

    // In prepeation for next iteration, restore the middle stat to the
    // interval [leftIndex, handles.length]
    middle.load(oldMiddleState)
  }

  // Trim the left and right index by `trimTime` milliseconds, but not more
  const leftTime = timestamps[bestLeftIndex]
  for (let i = bestLeftIndex; i <= bestRightIndex - 1; i++) {
    if (timestamps[i] - leftTime >= trimTime) {
      break
    }
    bestLeftIndex = i
  }

  const rightTime = timestamps[bestRightIndex - 1]
  for (let i = bestRightIndex; i >= bestLeftIndex; i--) {
    if (rightTime - timestamps[i - 1] >= trimTime) {
      break
    }
    bestRightIndex = i
  }

  // Return the .slice value
  return [bestLeftIndex, bestRightIndex]
}

module.exports = guessInterval

function statisticallyLessThan (leftSide, rightSide) {
  // Since handles are in steps of 1, looking for differences less than
  // 1 doesn't really make sense. The intervals are of course means and thus
  // the a valid difference could be less than one. But in practice we are
  // at a benchmarked server, thus the difference will always be much larger.
  const mindiff = 1

  // if the variance is very small or couldn't be estimated, just default
  // to a naive mean comparison.
  if (leftSide.variance < atol || rightSide.variance < atol ||
      Number.isNaN(leftSide.variance) || Number.isNaN(rightSide.variance)) {
    return leftSide.mean + mindiff < rightSide.mean
  }

  // variance is high, use a statistical t-test to check if there is a
  // difference
  const t = ttest(leftSide, rightSide, {
    alpha: 0.01,
    alternative: 'less',
    mu: -mindiff
  })
  return !t.valid()
}

// If you need to brush up on your online mean variance algorithms then take
// a look at:
//  https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance
// This is required for O(n^2) exact optimization of the interval. If a non
// online-variant was used, the complexity would be O(n^3).
class OnlineMeanVariance {
  constructor () {
    this.reset()
  }

  reset () {
    this.size = 0
    this.mean = 0
    this.sse = 0 // sum of square errors
  }

  save () {
    return {
      size: this.size,
      mean: this.mean,
      sse: this.sse
    }
  }

  load (save) {
    this.size = save.size
    this.mean = save.mean
    this.sse = save.sse
  }

  // Welford online algorithm is as follow:
  // - defined is:
  // δ_1 = x_n - µ_{n-1}
  // δ_2 = x_n - µ_n
  // Note that these will become computationally avaliable as they are needed.
  // This is due how to the online µ changes durring computation.

  // - Then compute:
  // ~ δ_1 is now avaliable
  // µ_n = µ_{n-1} + (x_n - µ_{n-1}) / n
  // µ_n = µ_{n-1} + δ_2 / n
  // ~ δ_2 is now avaliable
  // S_n = S_{n-1} + (x_n - µ_{n-1}) * (x_n - µ_n)
  // S_n = S_{n-1} + δ_1 * δ_2
  add (x) {
    this.size += 1
    const delta1 = x - this.mean
    this.mean += delta1 / this.size
    const delta2 = x - this.mean
    this.sse += delta1 * delta2
  }

  // This shows the inverse equations derived from the Welford operations
  // ~ δ_2 is now avaliable
  // µ_n = µ_{n-1} + (x_n - µ_{n-1}) / n
  // µ_{n-1} =  µ_n - (x_n - µ_{n-1}) / n
  // n µ_{n-1} =  n µ_n - x_n + µ_{n-1}
  // (n - 1) µ_{n-1} = n µ_n - x_n
  // (n - 1) µ_{n-1} = (n - 1) µ_n + µ_n - x_n
  // µ_{n-1} = µ_n + (µ_n - x_n) / (n - 1)
  // µ_{n-1} = µ_n - δ_2 / (n - 1)
  // ~ δ_1 is now avaliable
  // S_n = S_{n-1} + (x_n - µ_{n-1}) * (x_n - µ_n)
  // S_{n-1} = S_n - (x_n - µ_{n-1}) * (x_n - µ_n)
  // S_{n-1} = S_n - δ_1 * δ_2
  remove (x) {
    this.size -= 1
    const delta2 = x - this.mean
    this.mean -= delta2 / this.size
    const delta1 = x - this.mean
    this.sse -= delta2 * delta1
  }

  // This function is only used for the t-test. We want to minimize the MSE of
  // the curve fit. Since the number of observations stays constant, there is no
  // need calculate the extra divition in the scans. Thus the SSE can be used
  // directly.
  // σ_n = S_n / (n - 1)
  get variance () {
    if (this.size < 2) {
      return NaN
    } else {
      return this.sse / (this.size - 1)
    }
  }
}
