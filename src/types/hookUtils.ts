import type { TOOL_HOOK_EVENTS } from "../const";
import type { HookTypeMap } from "./hooks";
import type { BuiltInToolTypeMap } from "./tools";

export type HookEventName = keyof HookTypeMap;

export type HookInput<
	EventName extends HookEventName,
	ToolType extends keyof BuiltInToolTypeMap,
> = HookTypeMap<ToolType>[EventName]["Input"];

export type HookOutput<
	EventName extends HookEventName,
	ToolType extends keyof BuiltInToolTypeMap,
> = HookTypeMap<ToolType>[EventName]["Output"];

export type ToolHookEventName = (typeof TOOL_HOOK_EVENTS)[number];
