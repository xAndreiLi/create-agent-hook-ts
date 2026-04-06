import { TOOLS_TO_ENRICH } from "./const";
import { enrichToolInput } from "./enrich";
import { getHookInput, sendHookOutput } from "./ioHandlers";
import { isToolHook } from "./typeGuards";
import type { OtherArgs, Promisable } from "./types/helpers";
import type { HookEventName, HookInput, HookOutput } from "./types/hookUtils";
import type { BuiltInToolTypeMap } from "./types/tools";

type EnrichedToolType = (typeof TOOLS_TO_ENRICH)[number];

/**
 * Entry point for a VSCode Copilot Agent Hook script.
 *
 * Reads the hook payload from stdin, validates the hook event name against
 * `eventName`, optionally filters by `targetTools` for `PreToolUse` /
 * `PostToolUse` events, enriches select tool inputs,
 * then invokes `handler` with a fully typed input object
 * and writes the returned output to stdout.
 *
 * If the incoming hook event does not match `eventName`, or if the tool name
 * is not in `targetTools` (when provided), the process exits with code 0 and
 * the handler is never called, effectively skipping non-target events.
 *
 * @template EventName - The hook event being targeted (e.g. `"PostToolUse"`).
 * @template ToolNames - Tuple of built-in tool names to filter on for
 *   `[Pre|Post]ToolUse` events. Drives type inference for `input.tool_input`.
 *
 * @param eventName - The hook event this script should respond to.
 *   All available event names are surfaced via intellisense.
 * @param handler - Callback that contains your hook logic. Receives a
 *   strongly-typed `input` object whose shape is determined by `eventName`
 *   (and `targetTools` when provided). Must return — synchronously or
 *   asynchronously — the corresponding hook output object.
 *   The output object type is inferred from EventName.
 *   Additional fields for debugging may be added to output
 *   and will not affect the hook execution.
 * @param targetTools - Optional list of tool names for `PreToolUse` /
 *   `PostToolUse` hooks. When supplied, the handler only fires when
 *   `input.tool_name` is one of the listed tools, and `input.tool_input` is
 *   typed as the union of those tools' input shapes. All valid tool names are
 *   surfaced via intellisense. The utility function `isToolInputOf` can be used
 *   to type narrow the tool_input type in the handler.
 *
 * @returns A promise that resolves once the hook output has been written to
 *   stdout (or the process exits early).
 *
 * @example
 * // Block the agent after any file-editing tool fails lint or type-check
 * createAgentHook(
 *   "PostToolUse",
 *   async (input) => {
 *     // input.tool_input is typed as the union of the three tools below
 *     return { hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: "OK" } };
 *   },
 *   ["apply_patch", "create_file", "replace_string_in_file"],
 * );
 */
export async function createAgentHook<
	EventName extends HookEventName,
	const ToolNames extends (keyof BuiltInToolTypeMap)[],
>(
	eventName: EventName,
	handler: (
		input: HookInput<EventName, ToolNames[number]>,
	) => Promisable<HookOutput<EventName, ToolNames[number]> & OtherArgs>,
	targetTools?: ToolNames,
): Promise<void> {
	const input = await getHookInput<EventName>();
	if (input.hook_event_name !== eventName) {
		process.exit(0);
	}
	if (isToolHook(input)) {
		if (!targetTools?.includes(input.tool_name as ToolNames[number])) {
			process.exit(0);
		}
		if (TOOLS_TO_ENRICH.includes(input.tool_name as EnrichedToolType)) {
			enrichToolInput(input);
		}
	}
	const output = await handler(input);
	sendHookOutput(output);
}
