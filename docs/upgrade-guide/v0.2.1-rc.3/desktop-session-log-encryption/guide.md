---
kind: upgrade-guide
description: "Desktop session log downloads use administrator-encrypted age archives."
---

# Desktop session log encryption

English | [中文](guide.zh.md)

## Change

Desktop downloads use `lxo-session-<id>.zip.age` instead of a directly readable ZIP. The Desktop composition contains only an age public recipient. Local logs, Markdown copy, and ordinary Web exports are unchanged.

## Migration

1. Administrators back up `identity.age` and `password.txt` separately from employee distributions. Keep their directory restricted to the administrator account, including its Windows ACL.
2. Decrypt downloads using the [administrator export tool](../../../../packages/session-query/session-log-export/README.md#administrator-encrypted-exports), then open the resulting ZIP. Keep historical keys when changing the shipped public recipient.
3. Confirm a Desktop download ends in `.zip.age` and decrypts with the administrator identity. Wrong keys and damaged archives must fail without publishing a ZIP.
