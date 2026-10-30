---
kind: upgrade-guide
description: "Company IAM and manual API keys share the built-in company gateway."
---

# Company gateway login

English | [中文](guide.zh.md)

## Change

The original sign-in entry uses company IAM STG through the existing account provider. Manual API-key entry remains available. Both paths discover models and select an available default on the built-in company gateway, without configuring a provider. See the [account provider deployment requirements](../../../../packages/credentials/deepseek-account-platform/README.md#use-this-package).

Signed-out users can enter the workspace but have no usable company models. Sign-out removes the synchronized company key, models and default selection, and interrupts running company-model tasks. A retained or ambient key cannot bypass the account check. Startup removes company keys left without an account grant; sign in again to restore access.

## Migration

1. Back up the existing Harness home, including credentials, settings and profile overrides, before installing the test build. Retain the .3 installer; rollback requires restoring its matching data backup because downgrade compatibility has not been qualified.
2. Desktop automatically repairs legacy connection overrides before starting the Host and retains a backup beside the profile patch. Credentials, saved models and unrelated settings are preserved; no client repair script is required.
3. Administrators deploy the login endpoint and configure both application secrets on the existing versions server. Windows users only install the application and use the original login button or personal-key form, without editing files, running scripts or configuring environment variables.
4. Test IAM login and manual Key entry inside the company network. Confirm model discovery and the default model after each path, then sign out, check that company keys and models are cleared, and sign in again. Local fixture tests do not qualify real IAM or gateway services.
