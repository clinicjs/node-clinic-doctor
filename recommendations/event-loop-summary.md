Potential __Event Loop__ issue detected:

- There may be one or more long running synchronous operations blocking the thread
- Mitigate: Implement HTTP 503 event-loop protection
- Diagnose: Use [0x](https://www.npmjs.com/package/0x) to discover CPU intensive function calls

