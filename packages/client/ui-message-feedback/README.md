---
description: "The Web feedback surface: the feedback dialog and its acknowledgement and failure toasts. Like and Dislike are not shown beside assistant messages; for users and maintainers of the feedback experience."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-message-feedback

English | [中文](README.zh.md)

## Summary

This package is the Web GUI's feedback surface: the feedback dialog with its acknowledgement and failure toasts in the composer overlay, and a decoration that opens the dialog from a bare `/feedback`. Like and Dislike are not shown in the assistant message action row. One surface per Session backs the dialog, so one dialog serves the Session. Ratings, categories, and notes are log-only Session events that never enter model context.

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

Mount this plugin alongside `ui-conversation` and `ui-commands`. Like and Dislike stay off the assistant action row, between copy and branch. Mounting `session-log-export` adds Feedback to the Session Header's more-actions menu, which opens the dialog: seven category chips and a detail box are optional, and Submit records the Session remark before the toast thanks the user; the conversation log travels with every feedback event.

### Failures

A submission failure shows in a warning toast while the dialog stays open so the draft can be corrected. The assistant action row does not mount rating controls, including beside an interruption-frozen partial.

Access: the rating component is not mounted in the assistant action row; the header Feedback item has no Client check, and the Host refuses a submission without access.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The package registers a `feedback` entry (order 10) of `conversation.chat.assistant-actions` whose component renders nothing, so the finalized assistant message's IconActions row shows no Like or Dislike, and the `feedback-dialog` entry (order 2) of `conversation.input.overlay`, which renders the Modal and Toast primitives through body portals and centers the toast over the composer card it mounts inside. The `feedbackUi.openSession(sessionId)` Client service opens that same Session-scoped dialog without recording feedback; the Header menu and command decoration both use it. The `/feedback` decoration is an `action` registered through `ctx.commandUi.decorate`, so a menu pick or a bare Enter consumes the trigger token and opens the dialog while an argued line still reaches the Host command.

Per Session, one `MessageFeedbackController` backs every message control and one `FeedbackDialogController` owns the dialog draft, the submission, and the toast sequence. The message controller reads `messageFeedback.list` once, deferred to the first hover or focus rather than fired on mount, and serializes mutations so each carries the version last observed; a `version-conflict` reply carries the authoritative item and reconciles the view without refetching. Before either rating action proceeds, the row checks the committed item: the matching rating calls `retract`, which rechecks the rating in the serialized queue and becomes a no-op after a concurrent change, while any other state opens the dialog with the requested rating. The dialog controller submits by target: a message target puts that rating with the dialog's note and category through the message controller, and the Session target records through `ctx.remote.sessionFeedback`. Success closes the draft and raises the acknowledgement toast; a late success from a superseded draft raises that toast without closing the new draft; a failure keeps the draft open and raises a longer-lived warning toast.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the feedback surface is not enough. They move from the browser strip to the Session-log backends and the conversation shell.

- [dsh-message-feedback](../../feedback/message-feedback/README.md) — the Session-log backend that owns per-item compare-and-set and persistence.
- [dsh-command-feedback](../../feedback/command-feedback/README.md) — the `/feedback` command, the `sessionFeedback` Remote, and the category taxonomy.
- [ui-commands](../ui-commands/README.md) — the command decoration contract the `/feedback` row goes through.
- [ui-conversation](../ui-conversation/README.md) — declares the assistant-actions strip and the composer overlay.
- [Client package map](../README.md) — adjacent browser UI packages.

-----

<a id="model-experience"></a>
## Model Experience

None, as ratings, categories, and notes are log-only events, not model input. Optional Session-log delivery uses request metadata rather than model context.

#### KV Cache effect

None; feedback mutations leave the model-visible history unchanged.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>


These limits define the current feedback surface. They are current package constraints, not a general rating comparison or a task backlog.

- **Note size is a Host policy** — the deployment configures `maxNoteBytes` (8192 in the Web bundle) and the Host rejects an oversized note with `note-too-large`. The dialog does not pre-check the limit, so an oversized description for a message fails on submit rather than while typing; a Session remark has no bound.
- **No cross-tab push** — a second tab's rating becomes visible on reconnect or on the next conflict reply, not immediately; the controller does not consume feedback log events.
- **Action row** — Like and Dislike are not mounted beside assistant messages in the chat, trajectory, or waterfall views.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
