---
kind: upgrade-guide
description: "Desktop 会话日志下载使用由管理员解密的 age 加密包。"
---

# Desktop 会话日志加密

[English](guide.md) | 中文

## 变更

Desktop 下载使用 `lxo-session-<id>.zip.age`，不再提供可直接读取的 ZIP。Desktop 组合只包含 age 公钥接收方。本地日志、Markdown 复制和普通 Web 导出保持原样。

## 迁移

1. 管理员应备份 `identity.age` 和 `password.txt`，与员工分发包分开保管。目录应限制为管理员账号可访问，Windows 也需配置相应 ACL。
2. 使用[管理员导出工具](../../../../packages/session-query/session-log-export/README.zh.md#administrator-encrypted-exports)解密下载包，再打开得到的 ZIP。修改内置公钥时保留历史密钥。
3. 确认 Desktop 下载以 `.zip.age` 结尾，且可用管理员私钥解密。错误密钥和损坏文件应失败，不能发布 ZIP。
