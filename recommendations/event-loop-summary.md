- There may be one or more long running synchronous operations blocking the thread
- Mitigate: Implement HTTP 503 event-loop protection
- Diagnose: Use `clinic flame` to discover CPU intensive function calls – run <code class='snippet'>clinic flame -h</code>
- Use `--trace-sync-io` to track synchronous I/O operations
