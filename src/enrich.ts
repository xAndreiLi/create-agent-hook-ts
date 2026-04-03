import { isToolInputOf } from "./typeGaurds";
import type { HookInput, ToolHookEventName } from "./types/hookUtils";
import type { BuiltInToolTypeMap } from "./types/tools";

export function enrichToolInput(
	input: HookInput<ToolHookEventName, keyof BuiltInToolTypeMap>,
): void {
	if (isToolInputOf(input, "apply_patch")) {
		// Perform enrichment specific to the apply_patch tool
		enrichApplyPatchInput(input);
	}
}

function enrichApplyPatchInput(
	input: HookInput<"PreToolUse" | "PostToolUse", "apply_patch">,
): void {
	const applyPatchInput = input.tool_input.input;
	const filePathMatch = applyPatchInput.match(/\*\*\* Update File: (.+)\n/);
	if (!filePathMatch) {
		return;
	}
	const filePath = filePathMatch[1];

	const diffSectionMatch = applyPatchInput.match(
		/@@\n([\s\S]+?)\*\*\* End Patch/,
	);
	if (!diffSectionMatch) {
		return;
	}
	const diffLines = diffSectionMatch[1]?.split("\n") || [];

	const newLines = [];
	const oldLines = [];
	for (const line of diffLines) {
		if (line.startsWith("+") && !line.startsWith("+++")) {
			newLines.push(line.substring(1));
		} else if (line.startsWith("-") && !line.startsWith("---")) {
			oldLines.push(line.substring(1));
		}
	}
	input.tool_input.filePath = filePath;
	input.tool_input.newString = newLines.join("\n");
	input.tool_input.oldString = oldLines.join("\n");
}
