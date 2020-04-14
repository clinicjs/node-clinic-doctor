- There may be one or more long running synchronous operations blocking the thread
- Mitigate: Implement HTTP 503 event-loop protection
- Diagnose: Use `clinic flame` to discover CPU intensive function calls – run <code id='copyText'>clinic flame -h</code>
<button id='copyButton'>Copy</button> to get started.
