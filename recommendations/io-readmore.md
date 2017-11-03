### Understanding the analysis

Node.js provides a platform for non-blocking I/O. 
Unlike languages that typically block for IO (e.g. Java, PHP), Node.js passes I/O operations
to an accompanying C++ library (libuv) which delegates these operations to the Operating System.

Once an operation is complete, the notification bubbles up from the OS, through libuv, which can then
trigger any registered JavaScript functions (callbacks) for that operation. This is the typical 
flow for any asynchronous I/O (where as *Sync API's will block, but should never be used in a 
server/service request handling context).

The profiled process has been observed is unusually idle under load, typically this means 
it's waiting for external I/O because there's nothing else to do until the I/O completes.

To solve I/O issues we have to track down the asynchronous call(s) which are taking an 
abnormally long time to complete.

I/O root cause analysis is mostly a reasoning exercises, or requires advanced knowledge and 
expertise with specialist Node.js logging flags and (very new) asynchronous tracking API's.

At nearForm we care a lot about this problem and we are developing a new tool to make 
I/O debugging easier... stay tuned!
 

### Next Steps

- Use (or create) an external architecture diagram (logical, hardware, whatever is available) to 
understand all I/O "touch points", that is all I/O to/from the Node.js process (e.g. databases, network requests, filesystem...)
- Measure the response times of each of the I/O touch points
  - One approach is to instrument the Node.js process with `console.time` before an asynchronous call 
    and `console.timeEnd` at the top of the callback (or promise `then` handler, or after an `await` or whatever the asynchronous abstraction)
  - Another approach is write benchmarks specifically for the I/O touch points
    - Be sure to duplicate the exact conditions as generated in the Node.js process
- Run these measurements multiple times, look for unreasonably high response times
- Once slow I/O touch points have been discovered a strategy for speeding up the I/O is required  

**Advanced**: For more advanced, lower overhead, timing functionality, check out the experimental `perf_hooks` API  

**Advanced:** An alternative to the approach outlined above is to make use of the experimental
Node.js `async_hooks` API, in combination with a timer and stack trace generation.

### Reference

* [Overview of blocking vs non-blocking](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
* [`console.time`](https://developer.mozilla.org/en-US/docs/Web/API/Console/time)
* [`console.timeEnd`](https://developer.mozilla.org/en-US/docs/Web/API/Console/timeEnd)
* **Advanced**: [Node Docs: Perf Hooks](https://nodejs.org/api/perf_hooks.html)
* **Advanced**: [Node Docs: Async Hooks](https://nodejs.org/dist/latest-v8.x/docs/api/async_hooks.html) 
* **Advanced**: [V8 Stack Trace API](https://github.com/v8/v8/wiki/Stack-Trace-API)