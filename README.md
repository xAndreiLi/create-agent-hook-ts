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
};
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

![Hook event name example](hook-event-names.png)

---

**Input Fields** - Dynamically infers hook specific input type from hookEventName

ex. PostToolUse vs SessionStart

![PostToolUse example](post-tool-use-inputs.png)
![SessionStart example](session-start-inputs.png)

---

**Output Fields** - Dynamically infers output type when defining return object

![output example](output-example.png)

---

**Tool Names** - Displays all default tool names for [Pre|Post]ToolUse Hooks when configuring targetToolNames

![tool names example](tool-names.png)


---

**Tool Input** - Infers input.tool_input as the union of targetted tools

(ex. `filePath` is the only shared input field among `[apply_patch, create_file, replace_string_in_file]`)

![union of targets example](union-targets.png)

---

Provides a type-guard `isToolInputOf` to type narrow tool_input to access properly typed tool inputs for Copilot's default OpenAI/Claude Tools


![type narrowing example](is-tool-input-of.png)

---

### JSDoc Type descriptions that pull from the [VSCode Copilot Agent Hooks Documentation](https://code.visualstudio.com/docs/copilot/customization/hooks)

![docs example](docs.png)


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