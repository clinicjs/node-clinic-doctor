## Understanding the analysis

An unknown issue occurs when Clinic.js' analysis algorithms are unable to categorize the sampling results but nevertheless an issue *of some kind* has been detected.

This outcome can be attributed to one of two scenarios:

1. Ambient noise – for instance, other applications using the CPU or memory – during the sampling period has polluted the results.
2. There is a genuine performance issue but `clinic doctor` doesn't recognize it.

In the case of ambient noise, there may still be a specific, categorizable performance issue.

We can make eliminate the possibility of ambient noise and make it easier for Clinic.js to definitively recognize the issue by:

- Closing down as many applications as possible, especially applications that are CPU- or Memory- intensive.
- Using the `--on-port` flag. This can reduce the chances of unknown issues because there is no time gap nor additional system activity between the server starting and the load test beginning.

By way of example, instead of running `clinic -- node app.js` in one terminal and `autocannon localhost:3000` in another, it is preferable and recommended to trigger both in one command using the following command:

<code class='snippet'>clinic doctor --on-port="autocannon localhost:3000" -- node app.js</code>

An even simpler form of this is to use the `--autocannon` flag,

<code class='snippet'>clinic doctor --autocannon / -- node app.js</code>

If after taking these steps an unknown categorization continues to occur then we can instead attempt to infer the nature of the performance issue using specialist diagnostic tooling, such
as `clinic flame`, `clinic bubble` or Node Inspector.

## Next Steps

- First eliminate the possibility of ambient noise
    - Reduce noise by closing down as many other applications running on the system as possible - especially CPU or Memory intensive applications
    - Ensure that the `--on-port` flag is being used to trigger load testing instead of initiating load testing independently
- Use `clinic bubbleprof` to create a diagram of the application's asynchronous flow (see <code class='snippet'>clinic bubbleprof --help</code>)
- Explore the Bubbleprof diagram. Look for long lines and large circles representing persistent delays, then drill down to reveal the lines of code responsible
    - A common problem is the overuse or misuse of promises. `clinic bubbleprof` will visualize promise activity, make a point of looking out for it in the diagram.
- Use `clinic flame` to generate a flamegraph
    - Run <code class='snippet'>clinic flame --help</code> to get started
- Look for "hot" blocks, these are functions that are observed (at a higher relative frequency) to be at the top the stack per CPU sample – in other words, such functions are blocking the event loop
- For memory analysis use the [`--inspect`](https://nodejs.org/en/docs/inspector) flag with the Chrome Devtools *Memory* tab.
    - Run <code class='snippet'>node --inspect <FILENAME></code>
    - Open Chrome and navigate to [chrome://inspect](chrome://inspect)
    - Under the **Remote Target** heading, there should be a target with the official Node.js icon
    - Click the `inspect` link for that target – this will connect Chrome Devtools to the Node processes remote debug interface
    - In Devtools, select the *Memory* tab
    - Select the *Take heap snapshot* radio box, and then click *Take snapshot*
    - Put the process under load (in the same way that the process was load tested for Clinic.js)
    - Click *Profiles* in the left panel, then click *Take snapshot* again
    - Under the *HEAP SNAPSHOTS* left panel, select the second Snapshot (it will be called *Snapshot 2*)
    - Locate the dropdown box just above the "Constructor" column (most likely the dropdown box says *Summary*)
    - Click the dropdown, and select *Comparison* – this compares the before and after snapshots of the heap
    - Click the *# Delta* and/or *Size Delta* columns to sort by the difference in object counts
    or object size, categorized by constructor type
    - Use the interactive trees in the Constructor column to drill down into the specifics
    - Use the *Retainers* panel to understand the chain of object references

## Reference
- [Clinic.js Flame](https://clinicjs.org/flame)
- [Overview of blocking vs non-blocking](https://nodejs.org/en/docs/guides/blocking-vs-non-blocking/)
- [Concurrency model and Event Loop
](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)
- [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- Understanding Flamegraphs and how to use 0x: [Tuning Node.js app performance with autocannon and 0x](https://www.nearform.com/blog/tuning-node-js-app-performance-with-autocannon-and-0x/)
- [Clinic.js Bubbleprof](https://clinicjs.org/bubbleprof)
- [Chrome Devtools Docs: Fix Memory Problems](https://developers.google.com/web/tools/chrome-devtools/memory-problems/)
- [Chrome Devtools Docs: Memory Terminology](https://developers.google.com/web/tools/chrome-devtools/memory-problems/memory-101)
- [Chrome Devtools Docs: How to record heap snapshots](https://developers.google.com/web/tools/chrome-devtools/memory-problems/heap-snapshots)
- [Node Docs: Inspector](https://nodejs.org/en/docs/inspector/)
- **Advanced**: [Core dump analysis tool for Linux: llnode](https://github.com/nodejs/llnode)
- **Advanced**: [Core dump analysis tool for SmartOS: mdb_v8](https://github.com/joyent/mdb_v8)
- **Advanced**: [Core dump analysis tool for Linux which wraps SmartOS mdb](https://www.npmjs.com/package/autopsy)
