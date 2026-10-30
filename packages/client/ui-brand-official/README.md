---
description: "Lingxi Office vector artwork for the sidebar and conversation home in every build; for users and maintainers choosing or replacing brand presentation."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-brand-official

English | [中文](README.zh.md)

## Summary

This package gives the sidebar and conversation home the Lingxi Office six-petal mark and places its name in the sidebar. It applies in every build profile. Choose it for deployments branded as Lingxi Office; deployments with another identity should provide a replacement brand package. It has no runtime state and does not affect model requests.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount this plugin in the browser roster of a Lingxi Office deployment.

### Choosing the profile

The brand registers whenever the plugin is mounted, independently of `DSH_CLIENT_BUILD_PROFILE`. The sidebar and conversation home use the same six-petal vector geometry. The browser title remains a separate build setting.

### Replacing the brand

A deployment with its own identity leaves this package out and composes another package that occupies the sidebar and conversation hero slots. Occupying a slot is the only composition route; there is no brand configuration surface here.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The sidebar occupants install as one declaration-aware registration set; the conversation hero registers independently when its declaring component is present. Each registration withdraws with its declaration and on plugin disposal. The browser half is [`src/client/index.ts`](src/client/index.ts); the node half is an empty Loader seat. The browser title is a build-environment concern (`DSH_CLIENT_TITLE`), outside the slot system.

The vector masters live in `artwork/mark.svg` and `artwork/name.svg`. Run `pnpm --filter @deepseek-ai/dsh-desktop run render:brand-assets` from the repository root to regenerate desktop, installer, welcome, favicon, Web installation, and Client geometry assets. The flower uses six solid fills and smooth curves without bitmap tracing noise.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the brand surface is not enough. They move from the slots this package occupies to the shell that renders them.

- [ui-sidebar](../ui-sidebar/README.md) — declares `sidebar.brand.mark` and `sidebar.brand.name` and renders their fallbacks.
- [ui-conversation](../ui-conversation/README.md) — declares `conversation.hero.brand.mark` in the hero.
- [Web client architecture](../../../docs/subsystems/web-client.md) — how browser plugin rows load and register slots.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package contributes browser presentation only; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define how brand presentation is supplied. They are current package constraints, not a brand-design comparison or a task backlog.

- **One occupant set** — alternative presentation belongs in another Cordis package occupying the same slots.
- **The browser title is independent** — `DSH_CLIENT_TITLE` selects title text at build time rather than through a UI slot.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
