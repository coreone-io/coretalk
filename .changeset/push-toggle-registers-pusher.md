---
default: patch
---

Register the web push pusher from the page instead of messaging the service
worker. When the page is not yet controlled by the worker — first visit after
install, or a hard reload — `serviceWorker.controller` is `null` and the
message was dropped silently: the toggle looked enabled while no pusher
existed on the homeserver. The direct call surfaces server errors in the
settings tile.
