- The process may have a memory management issue
- This can mean that your application might be spending more time than expected in memory allocations
- Diagnose: Use `clinic heapprofiler` to discover the functions which allocates more memory at heap – run clinic heapprofiler -h
