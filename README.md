# create-agent-hook-ts

A Typescript library to streamline the development of VSCode Copilot Agent Hooks. Provides a full suite of dynamic types that cover all parts of hook creation and additional utilities including the tool matching pattern defined in Claude Code that is not implemented in GitHub Copilot Hooks.

This library exposes a createAgentHook method that accepts the hook event being targetted, a callback defining the logic of your hook, and an optional list of tool names to target for [Pre|Post]ToolUse hooks.

Designed to be used in a .ts script that is run as a Copilot Hook command.

`.github/hooks/your-hook.json` :

```json
{
	"hooks": {
		"PostToolUse": [
			{
				"type": "command",
				"command": "./.github/hooks/your-hook.ts",
			},
		],
	},
}
```

## Key Features

### Handles stdio for Hook Input/Output

Don't worry about handling hook stdio and reading from buffers.
For hook input, createAgentHook reads from stdin and parses the hook input before sending it to the user defined callback with the correctly inferred types and enriched fields.

For hook output, the current implementation of createAgentHook just outputs the user defined callback return value directly to stdout, following the standard method of sending Copilot Hook output. In the future, there are plans to provide an output utility that will abstract the nuanced decisions that Copilot Hooks make based on output fields and process exit code.

### Enables Targetting Specific Tools in ToolUse Hooks

Following the lead of the Claude Hooks matcher for tool names (which is not natively supported by VSCode Copilot Hooks), users can add an optional array of tool names to target for [Pre|Post]ToolUse hooks. The user's hook callback will only fire if the hook input's tool_name matches a tool name in the array. Instead of using a pattern match (like is done in Claude Hooks), we use the full tool name to enable type inference for the tool_input based on targetted tools. This is supplemented by providing intellisense for possible tool names when users are configuring targetToolNames.

Example:

```typescript
// Will only fire callback on tools that edit files
createAgentHook(
    "PostToolUse",
    (input) => {
        return {};
    },
    ["apply_patch", "create_file", "replace_string_in_file"],
);
```

### Extensive Dynamically Typed Intellisense

All types and literals that you need to know to write a hook from start to finish can be read from intellisense via type inference on createAgentHook parameters.
Every step for invoking createAgentHook has dynamic intellisense based on previous parameters that constrain types to only possible values.

---

**Hook Event Names** - Displays all available hook events when first invoking createAgentHook

<img width="1022" height="301" alt="image" src="https://github.com/user-attachments/assets/0d2a2999-b81f-46c6-9201-a2333d64dd59" />

---

**Input Fields** - Dynamically infers hook specific input type from hookEventName

ex. PostToolUse vs SessionStart

<img width="1025" height="311" alt="image" src="https://github.com/user-attachments/assets/5f65cb7f-65c3-4277-aed6-6d9dfe686674" />
<img width="1037" height="284" alt="image" src="https://github.com/user-attachments/assets/f290b2d4-7d71-426d-ad72-250b0ed619eb" />

---

**Output Fields** - Dynamically infers output type when defining return object

<img width="1037" height="267" alt="image" src="https://github.com/user-attachments/assets/0a122ecf-dfc3-40f4-9001-cd832cf7114e" />
<img width="1032" height="220" alt="image" src="https://github.com/user-attachments/assets/5b470771-3a0a-423c-b119-157bf114af1f" />

---

**Tool Names** - Displays all default tool names for [Pre|Post]ToolUse Hooks when configuring targetToolNames

<img width="1031" height="388" alt="image" src="https://github.com/user-attachments/assets/d690866e-b96f-47c0-b6e2-8d72b3db734c" />

---

**Tool Input** - Infers input.tool_input as the union of targetted tools

(ex. `query` is the only shared input field among `[fetch_webpage, file_search]`)

<img width="1040" height="248" alt="image" src="https://github.com/user-attachments/assets/42c260f3-50fd-42f9-b351-5f1c32fa26a4" />

---

Provides a type-guard `isToolInputOf` to type narrow tool_input to access properly typed tool inputs for Copilot's default OpenAI/Claude Tools

<img width="1037" height="250" alt="image" src="https://github.com/user-attachments/assets/0a05be60-50dd-460e-82b2-21d41d8a5a21" />

---

### JSDoc Type descriptions that pull from the [VSCode Copilot Agent Hooks Documentation](https://code.visualstudio.com/docs/copilot/customization/hooks)

<img width="1035" height="224" alt="image" src="https://github.com/user-attachments/assets/2bdb9e41-24ef-4340-a96e-815bd03a1cea" />

### Enriches tool_input and normalizes OpenAI and Claude Tool Inputs

**(i.e. ApplyPatch vs ReplaceStringInFile)**

Claude ReplaceStringInFile tool's structure ({ oldString, newString, filePath }) was added to the OpenAI ApplyPatch tool with values parsed from the ApplyPatch input string. This is automatically added to enrich the tool_input when createAgentHook detects tool_name ApplyPatch from hook input, allowing users to access ApplyPatch update values and file name without parsing the string themselves.

## Examples

### Typecheck and Lint Hook on PostToolUse for tools that edit code

```typescript
#!/usr/bin/env bunx

import fs from "fs";
import util from "node:util";
import child_process from "node:child_process";
import { createAgentHook } from "create-agent-hook-ts";
const exec = util.promisify(child_process.exec);

createAgentHook(
	"PostToolUse",
	async (input) => {
		let didLintFail = false;
		let didTscFail = false;
		const lintPromise = exec(
			"npx nx test:lint one-explorer-tools-package-bump",
		).catch((error) => {
			didLintFail = true;
			return { stdout: error.stdout, stderr: error.stderr };
		});
		const tscPromise = exec(
			"npx nx test:typecheck one-explorer-tools-package-bump",
		).catch((error) => {
			didTscFail = true;
			return { stdout: error.stdout, stderr: error.stderr };
		});
		const [lintResult, tscResult] = await Promise.all([
			lintPromise,
			tscPromise,
		]);
		if (didLintFail)
			fs.writeFile("lint.log", lintResult.stdout, "utf-8", () => {});
		else fs.rm("lint.log", { force: true }, () => {});
		if (didTscFail)
			fs.writeFile("typecheck.log", tscResult.stdout, "utf-8", () => {});
		else fs.rm("typecheck.log", { force: true }, () => {});
		if (didLintFail || didTscFail) {
			const message = `Your last edit failed ${
				didLintFail ? `linting (check ${input.cwd}/lint.log)` : ""
			}${
				didLintFail && didTscFail ? " and " : ""
			}${didTscFail ? `type check (check ${input.cwd}/typecheck.log)` : ""}. Please fix the errors and try again.`;
			return {
				decision: "block",
				reason: "Failed lint or type check",
				hookSpecificOutput: {
					hookEventName: "PostToolUse",
					additionalContext: message,
				},
			};
		}
		return {
			hookSpecificOutput: {
				hookEventName: "PostToolUse",
				additionalContext: "Lint and TSC checks passed, good job!",
			},
		};
	},
	[
		"apply_patch",
		"create_file",
		"replace_string_in_file",
		"multi_replace_string_in_file",
	],
);
```
