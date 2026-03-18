import { TOOLS_TO_ENRICH } from "./const";
import { enrichToolInput } from "./enrich";
import { getHookInput, sendHookOutput } from "./ioHandlers";
import { isToolHook } from "./typeGaurds";
import type { OtherArgs, Promisable } from "./types/helpers";
import type { HookEventName, HookInput, HookOutput } from "./types/hookUtils";
import type { BuiltInToolTypeMap } from "./types/tools";

type EnrichedToolType = (typeof TOOLS_TO_ENRICH)[number];

export async function createAgentHook<
	EventName extends HookEventName,
	const ToolNames extends (keyof BuiltInToolTypeMap)[],
>(
	eventName: EventName,
	handler: (
		input: HookInput<EventName, ToolNames[number]>,
	) => Promisable<HookOutput<EventName, ToolNames[number]>> & OtherArgs,
	targetTools?: ToolNames,
): Promise<void> {
	const input = await getHookInput<EventName>();
	if (input.hookEventName !== eventName) {
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
