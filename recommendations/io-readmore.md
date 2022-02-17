## Understanding the analysis

Node.js provides a platform for non-blocking I/O.
Unlike languages that typically block for IO (e.g. Java, PHP), Node.js passes I/O operations
to an accompanying C++ library (libuv) which delegates these operations to the Operating System.

Once an operation is complete, the notification bubbles up from the OS, through libuv, which can then
trigger any registered JavaScript functions (callbacks) for that operation. This is the typical
flow for any asynchronous I/O (where as *Sync API*'s will block, but should never be used in a
server/service request handling context).

The profiled process has been observed is unusually idle under load, typically this means
it's waiting for external I/O because there's nothing else to do until the I/O completes.

To solve I/O issues we have to track down the asynchronous call(s) which are taking an
abnormally long time to complete.

I/O root cause analysis is mostly a reasoning exercise. [Clinic.js Bubbleprof](https://clinicjs.org/bubbleprof) is a tool developed specifically to inform and ease this kind of reasoning.

## Next Steps
- Use `clinic bubbleprof` to create a diagram of the application's asynchronous flow.
    + See <code class='snippet'>clinic bubbleprof --help</code> for how to generate the profile
    + Visit the [Bubbleprof walkthrough](https://clinicjs.org/bubbleprof/walkthrough) for a guide on how to use and interpret this output
- Explore the Bubbleprof diagram. Look for long lines and large circles representing persistent delays, then drill down to reveal the lines of code responsible
- Pay particular attention to "userland" delays, originating from code in the profiled application itself.
- Identify possible optimization targets using knowledge of the application's I/O touch points (the I/O to and from the Node.js process, such as databases, network requests, and filesystem access). For example:
    + Look for operations in series which could be executed in parallel
    + Look for slow operations that can be optimised externally (for example with caching or indexing)
    + Consider if a large processes has good reasons for being almost constantly in the queue (for example, some server handlers)

## Reference

* [Overview of blocking vs non-blocking](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
* [`console.time`](https://developer.mozilla.org/en-US/docs/Web/API/Console/time)
* [`console.timeEnd`](https://developer.mozilla.org/en-US/docs/Web/API/Console/timeEnd)
* **Advanced**: [Node Docs: Perf Hooks](https://nodejs.org/api/perf_hooks.html)
* **Advanced**: [Node Docs: Async Hooks](https://nodejs.org/api/async_hooks.html)
* **Advanced**: [V8 Stack Trace API](https://github.com/v8/v8/wiki/Stack-Trace-API)
