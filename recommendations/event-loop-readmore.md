## Understanding the analysis

JavaScript is a single-threaded event-driven non-blocking language.

In Node.js I/O tasks are delegated to the Operating System, JavaScript functions (callbacks)
are invoked once a related I/O operation is complete. At a rudimentary level, the process of
queueing events and later handling results in-thread is conceptually achieved with the
"Event Loop" abstraction.

At a (very) basic level the following pseudo-code demonstrates the Event Loop:
`while (event) handle(event)`

The Event Loop paradigm leads to an ergonomic development experience for high concurrency programming
(relative to the multi-threaded paradigm).

However, since the Event Loop operates on a single thread this is essentially a shared
execution environment for every potentially concurrent action. This means that if the
execution time of any line of code exceeds an acceptable threshold it interferes with
processing of future events (for instance, an incoming HTTP request); new events cannot
be processed because the same thread that would be processing the event is currently
blocked by a long-running synchronous operation.

Asynchronous operations are those which queue an event for later handling, they tend to be
identified by an API that requires a callback, or uses promises (or async/await).

Whereas synchronous operations simply return a value. Long running synchronous operations are either
functions that perform blocking I/O (such as `fs.readFileSync`) or potentially resource intensive
algorithms (such as `JSON.stringify` or `react.renderToString`). The `--trace-sync-io` can help
by printing a stack trace whenever synchronous I/O is detected after the first run of the event
loop.

To solve the Event Loop issue, we need to find out where the synchronous bottleneck is.
This may (commonly) be identified as a single long-running synchronous function, or
the bottleneck may be distributed which would take rather more detective work.

## Next Steps
- If the system is already deployed, mitigate the issue immediately by implementing
  HTTP 503 Service Unavailable functionality (see *Load Shedding* in **Reference**)
    + This should allow the deployments Load Balance to route traffic to a different service instance
    + In the worse case the user receives the 503 in which case they must retry (this is still preferable to waiting for a timeout)
- Use `clinic flame` to generate a flamegraph
    + Run <code class='snippet'>clinic flame --help</code> to get started
    + see "Understanding Flamegraphs and how to use [0x](https://www.npmjs.com/package/0x)" article in the **Reference** section for more information
- Look for "hot" blocks, these are functions that are observed (at a higher relative frequency) to be at the top the stack per CPU sample – in other words, such functions are blocking the event loop
  - (In the case of a distributed bottleneck, start by looking for lots of wide tips at the top of the Flamegraph)

## Reference

- Load Shedding
    + Express, Koa, Restify, `http`: [overload-protection](https://www.npmjs.com/package/overload-protection)
    + Hapi: [Server load sampleInterval option](https://hapi.dev/api/#server.options.load) & [Server load maxEventLoopDelay option](https://hapi.dev/api/#server.options.load)
    + Fastify: [under-pressure](https://www.npmjs.com/package/under-pressure)
    + General: [loopbench](https://www.npmjs.com/package/loopbench)
- [Concurrency model and Event Loop
](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [Overview of Blocking vs Non-Blocking](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- Understanding Flamegraphs and how to use 0x: [Tuning Node.js app performance with autocannon and 0x](https://www.nearform.com/blog/tuning-node-js-app-performance-with-autocannon-and-0x/)
- [Why Event Loop Utilization is an important metric](https://nodesource.com/blog/event-loop-utilization-nodejs)
