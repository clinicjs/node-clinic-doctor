- There may be one or more long running synchronous operations blocking the thread
- Mitigate: Implement HTTP 503 event-loop protection
- Diagnose: Use `clinic flame` to discover CPU intensive function calls – run 
<code id='copyText'>clinic flame -h</code>
<button id='copyButton' onclick='copy()'>Copy</button> to get started.
<script>
  function copy() {
    const body = document.getElementsByTagName('body')[0]
    const copyText = document.getElementById('copyText').innerHTML
    const tempInput = document.createElement('INPUT')
    body.appendChild(tempInput)
    tempInput.setAttribute('value', copyText)
    tempInput.select()
    document.execCommand('copy')
    body.removeChild(tempInput)
  }
</script>
