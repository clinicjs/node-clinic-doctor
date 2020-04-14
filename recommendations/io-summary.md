- There may be long-running asynchronous activities
- This can mean that the bottleneck is not the Node process at all, but rather an I/O operation
- Diagnose: Use `clinic bubbleprof` to explore asynchronous delays – run
<code id='copyText'>clinic bubbleprof -h</code>
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
