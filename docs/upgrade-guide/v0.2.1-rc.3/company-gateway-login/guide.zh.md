---
kind: upgrade-guide
description: "公司 IAM 与手动 API Key 共用内置公司网关。"
---

# 公司网关登录

[English](guide.md) | 中文

## 变更

原登录入口通过现有账号 provider 连接公司 IAM STG，手动填写 API Key 入口保留。两种方式在内置公司网关发现模型并选择可用默认值，无需配置 provider。参见[账号 provider 部署要求](../../../../packages/credentials/deepseek-account-platform/README.zh.md#use-this-package)。

未登录用户可以进入工作区，但没有可用公司模型。退出会删除已同步的公司 Key、模型和默认模型，并中断运行中的公司模型任务。遗留 Key 或环境中的 Key 不能绕过账号检查。启动时删除没有账号授权的公司 Key，需重新登录恢复访问。

## 迁移

1. 安装测试包前备份现有 Harness 主目录，包括凭证、设置和配置覆盖。保留 .3 安装包；回滚需恢复与它对应的数据备份，降级兼容性尚未验证。
2. Desktop 在启动 Host 前自动修复旧连接覆盖，并在 profile 配置旁保留备份；凭证、已保存模型和其他设置保留，无需客户端修复脚本。
3. 管理员在现有 versions 服务器部署登录接口并填写两个应用密钥；Windows 用户只需安装应用后点击原登录按钮或填写个人 Key，无需修改文件、执行脚本或配置环境变量。
4. 在公司内网分别验证 IAM 登录和手动填写 Key，确认模型发现与默认模型，然后退出，检查公司 Key 和模型已清空，再次登录。本地模拟测试不代表真实 IAM 或网关联调已通过。
