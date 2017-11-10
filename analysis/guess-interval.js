'use strict'

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
  for (let leftIndex = 0; leftIndex < handles.length - 1; leftIndex++) {
    // set interval to [leftIndex, handles.length]
    left.add(handles[leftIndex])
    middle.remove(handles[leftIndex])
    right.reset()

    // check for improvement
    if (bestTotalError > left.sse + middle.sse + right.sse) {
      bestTotalError = left.sse + middle.sse + right.sse
      bestLeftIndex = leftIndex + 1
      bestRightIndex = handles.length
    }

    // try all valid rightIndex values
    // because the middle is going to mutate as we scan from the right, save
    // the middle state for the interval [leftIndex, handles.length]
    const oldMiddleState = middle.save()
    // Middle should always include at least one value, so don't scan to
    // leftIndex but instead `leftIndex + 1`.
    for (let rightIndex = handles.length - 1; rightIndex > leftIndex + 1; rightIndex--) {
      // set interval to [leftIndex, rightIndex]
      right.add(handles[rightIndex])
      middle.remove(handles[rightIndex])

      // check for improvement
      if (bestTotalError > left.sse + middle.sse + right.sse) {
        bestTotalError = left.sse + middle.sse + right.sse
        bestLeftIndex = leftIndex + 1
        bestRightIndex = rightIndex
      }
    }

    // In prepeation for next iteration, restore the middle state to the
    // interval [leftIndex, handles.length]
    middle.load(oldMiddleState)
  }

  return [bestLeftIndex, bestRightIndex]
}

module.exports = guessInterval

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
    this.observations = 0
    this.mean = 0
    this.sse = 0 // sum of square errors
  }

  save () {
    return {
      observations: this.observations,
      mean: this.mean,
      sse: this.sse
    }
  }

  load (save) {
    this.observations = save.observations
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
    this.observations += 1
    const delta1 = x - this.mean
    this.mean += delta1 / this.observations
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
    this.observations -= 1
    const delta2 = x - this.mean
    this.mean -= delta2 / this.observations
    const delta1 = x - this.mean
    this.sse -= delta2 * delta1
  }

  // This function is not currently used. We want to minimize the MSE of the
  // curve fit. Since the number of observations stays constant, there is no
  // need calculate the extra divition. Thus the SSE can be used directly.
  // The variance function is current just included for completeness and
  // debugging.
  // σ_n = S_n / (n - 1)
  get variance () {
    if (this.observations < 2) {
      return NaN
    } else {
      return this.sse / (this.observations - 1)
    }
  }
}
