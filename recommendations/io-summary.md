- There may be long-running asynchronous activities
- This can mean that the bottleneck is not the Node process at all, but rather an I/O operation
- Diagnose: Use `clinic bubbleprof` to explore asynchronous delays – run
<code id='copyText'>clinic bubbleprof -h</code>
<button id='copyButton'>Copy</button> to get started.
