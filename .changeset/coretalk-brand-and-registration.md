---
default: patch
---

Brand the client with the deployment's product name and let a deployment declare
that accounts are created elsewhere (`allowRegistration: false`): the client then
skips the registration probe and hides the register link.
