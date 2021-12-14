## Understanding the analysis

JavaScript is Garbage Collected language. Rather than manually freeing objects, they
are simply "cleaned away" at some point after all references to an object have been removed.

At a basic level, the Garbage Collector traverses the JavaScript objects at various intervals to find any
"orphaned" objects (objects which no longer have any references). If there are too many
objects, and/or too many orphaned objects this can cause performance issues – because the Garbage
Collector uses the same thread as the JavaScript event loop. In other words, JavaScript execution
pauses while the Garbage Collector clears away de-referenced objects.

At a more detailed level, GC collection is triggered by memory activity, rather than time and
objects are classified by the GC into young and old. "Young" objects are
traversed (scavenged) more frequently, while "old" objects will stay in memory for longer. So there
are actually two GC types, a frequent scavenge of new space (short lived objects) and a less regular traversal of
old space (objects that survived enough new space scavenges).

Several heuristics may trigger detection of a GC issue, but they all center around high
memory usage.

One possible cause of a detected GC issue is a memory leak, where objects are being accidentally
allocated. However there are other (more common) cases where the is no leak but the memory strategy
needs to be adapted.

One such common case is when large objects (such as may be generated for big JSON payloads), are
created during periods of high activity (e.g. under request load). This can cause the objects
to be moved into old space – if they survive two (by default) GC scavenges – where they will live
for longer due to the less frequent scavenges. Objects can then build up in "old space" and
cause intermittent process stalling during Garbage Collection.

Depending on the use case this may be solved in different ways. For instance if the goal is to write
out serialized objects, then the output could be written to the response as strings (or buffers) directly
instead of creating the intermediate objects (or a combined strategy where part of the object is written out
from available state). It may just be a case that a functional approach (which is usually recommended) is
leading to the repeated creation of very similar objects, in which case the logical flow between functions
in a hot path could be adapted to reuse objects instead of create new objects.

Another possibility is that a very high amount of short lived objects are created, filling up the
"young" space and triggering frequent GC sweeps – if this case *isn't* an unintended memory leak,
then then an object pooling strategy may be necessary.

To solve Garbage Collection issues we have to analyse the state of our process in order to track down the
root cause behind the high memory consumption.

## Next Steps

- If the system is already deployed, mitigate the issue immediately by implementing
  HTTP 503 Service Unavailable functionality (see *Load Shedding* in **Reference**)
- Use `clinic heapprofiler` to create a flamegraph of memory allocations in the application.
    + See <code class='snippet'>clinic heapprofiler --help</code> for how to generate the memory profile.
    + Visit the [Heapprofiler walkthrough](https://clinicjs.org/documentation/heapprofiler/) for a guide on how to use and interpret this output
- Look for "hot" blocks, those are functions that are observed to be at the top the stack per memory allocation sample – in other words, such functions are allocation more memory in the heap
  - (In the case of a distributed bottleneck, start by looking for lots of wide tips at the top of the Flamegraph)

## Reference

- Load Shedding
    + Express, Koa, Restify, `http`: [overload-protection](https://www.npmjs.com/package/overload-protection)
    + Hapi: [Server load sampleInterval option](https://hapi.dev/api/#-serveroptionsload) & [Server connections load maxEventLoopDelay](https://hapi.dev/api/#-serveroptionsload)
    + Fastify: [under-pressure](https://www.npmjs.com/package/under-pressure)
    + General: [loopbench](https://www.npmjs.com/package/loopbench)
- [Chrome Devtools Docs: Fix Memory Problems](https://developers.google.com/web/tools/chrome-devtools/memory-problems/)
- [Chrome Devtools Docs: Memory Terminology](https://developers.google.com/web/tools/chrome-devtools/memory-problems/memory-101)
- [Chrome Devtools Docs: How to record heap snapshots](https://developers.google.com/web/tools/chrome-devtools/memory-problems/heap-snapshots)
- **Advanced**: [Core dump analysis tool for Linux: llnode](https://github.com/nodejs/llnode)
- **Advanced**: [Core dump analysis tool for SmartOS: mdb_v8](https://github.com/joyent/mdb_v8)
- **Advanced**: [Core dump analysis tool for Linux which wraps SmartOS mdb](https://www.npmjs.com/package/autopsy)
