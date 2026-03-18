import { TOOL_HOOK_EVENTS } from "./const";
import type { HookTypeMap } from "./types/hooks";
import type { HookInput, ToolHookEventName } from "./types/hookUtils";
import type { BuiltInToolTypeMap } from "./types/tools";

export function isToolHook(
	input: HookInput<keyof HookTypeMap, keyof BuiltInToolTypeMap>,
): input is HookInput<ToolHookEventName, keyof BuiltInToolTypeMap> {
	return TOOL_HOOK_EVENTS.includes(input.hookEventName as ToolHookEventName);
}

export function isToolInputOf<ToolType extends keyof BuiltInToolTypeMap>(
	input: HookInput<ToolHookEventName, keyof BuiltInToolTypeMap>,
	toolName: ToolType,
): input is HookInput<ToolHookEventName, ToolType> {
	return isToolHook(input) && input.tool_name === toolName;
}
