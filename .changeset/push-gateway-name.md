---
default: patch
---

Point web push at the Matrix push gateway's own hostname (`push-m`): the
deployment runs a second gateway for non-Matrix services, and one name could
not serve both — they speak different protocols and hold their own
subscriptions.
