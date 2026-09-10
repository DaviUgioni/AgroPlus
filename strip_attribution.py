message = re.sub(br"\n*Co-Authored-By:\s*Claude[^\n]*\n?", b"\n", message)
message = re.sub(br"\n*Claude-Session:\s*[^\n]*\n?", b"\n", message)
return message.rstrip(b"\n") + b"\n"
