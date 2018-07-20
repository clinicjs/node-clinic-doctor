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
abnormally long time to complete. I/O root cause analysis is mostly a reasoning exercise.

It used to requires advanced knowledge and
expertise with specialist Node.js logging flags and (very new) asynchronous tracking API's – however, we care a lot about this problem at nearForm, and have developed a new Clinic tool to make I/O debugging easier: [Clinic Bubbleprof](https://clinicjs.org/bubbleprof)

## Next Steps
- Make sure you are aware of the application's I/O "touch points": that is, I/O to and from the Node.js process (e.g. databases, network requests, filesystem...)
- Use `clinic bubbleprof` to create a diagram of the application's asynchronous flow.
  - See `clinic bubbleprof --help` for how to generate the profile
  - Visit https://clinicjs.org/bubbleprof/walkthrough for a guide on how to use and interpret this output

- Explore the Bubbleprof diagram. Look for long lines and large circles, representing persistent delays, then drill down to reveal the lines of code responsible
- Pay particular attention to "userland" delays, originating from code in the profiled application itself.
- Use your understanding of the application's I/O touch points to identify possible optimization targets, such as operations in series which could be executed in parallel, or slow operations that can be optimised externally (for example with caching or indexing). Some large processes will have good reasons for being almost constantly in the queue (for example, some server handlers)

## Reference

* [Overview of blocking vs non-blocking](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
* [`console.time`](https://developer.mozilla.org/en-US/docs/Web/API/Console/time)
* [`console.timeEnd`](https://developer.mozilla.org/en-US/docs/Web/API/Console/timeEnd)
* **Advanced**: [Node Docs: Perf Hooks](https://nodejs.org/api/perf_hooks.html)
* **Advanced**: [Node Docs: Async Hooks](https://nodejs.org/dist/latest-v8.x/docs/api/async_hooks.html)
* **Advanced**: [V8 Stack Trace API](https://github.com/v8/v8/wiki/Stack-Trace-API)
