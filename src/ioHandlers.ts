import type { HookEventName, HookInput, HookOutput } from "./types/hookUtils";
import type { BuiltInToolTypeMap } from "./types/tools";

export async function getHookInput<EventName extends HookEventName>(): Promise<
	HookInput<EventName, keyof BuiltInToolTypeMap>
> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}
	const inputString = Buffer.concat(chunks).toString("utf-8");
	return JSON.parse(inputString) as HookInput<
		EventName,
		keyof BuiltInToolTypeMap
	>;
}

export function sendHookOutput<
	EventName extends HookEventName,
	ToolType extends keyof BuiltInToolTypeMap,
>(output: HookOutput<EventName, ToolType>): boolean {
	const outputString = JSON.stringify(output);
	return process.stdout.write(outputString);
}
