---
default: patch
---

Point web push at the deployment's own gateway: the client now reads the push
gateway URL, VAPID public key and the web, iOS and UnifiedPush application ids
from `config.json`. The pusher also introduces itself with the deployment's
product name instead of a hardcoded one, so people recognise it in their device
list.
