import type { BuiltInToolTypeMap } from "./tools.js";

export interface HookTypeMap<
	ToolType extends keyof BuiltInToolTypeMap = keyof BuiltInToolTypeMap,
> {
	SessionStart: {
		Input: SessionStartInput;
		Output: SessionStartOutput;
	};
	UserPromptSubmit: {
		Input: UserPromptSubmitInput;
		Output: UserPromptSubmitOutput;
	};
	PreToolUse: {
		Input: PreToolUseInput<ToolType>;
		Output: PreToolUseOutput<ToolType>;
	};
	PostToolUse: {
		Input: PostToolUseInput<ToolType>;
		Output: PostToolUseOutput;
	};
	PreCompact: {
		Input: PreCompactInput;
		Output: PreCompactOutput;
	};
	SubagentStart: {
		Input: SubagentStartInput;
		Output: SubagentStartOutput;
	};
	SubagentStop: {
		Input: SubagentStopInput;
		Output: SubagentStopOutput;
	};
	Stop: {
		Input: StopInput;
		Output: StopOutput;
	};
}

interface CommonHookInput {
	/** ISO string of when the event occurred e.g. "2026-02-09T10:30:00.000Z" */
	timestamp: string;
	/** Current working directory of the agent process */
	cwd: string;
	/** Unique identifier for the agent session */
	sessionId: string;
	/** The name of the hook event */
	hookEventName: keyof HookTypeMap;
	/** Path to the transcript file for the session */
	transcript_path: string;
}

interface CommonHookOutput {
	/** Set to false to stop processing (default: true) */
	continue?: boolean;
	/** Reason for stopping, when continue is false (shown to the user) */
	stopReason?: string;
	/** Warning message displayed to the user */
	systemMessage?: string;
}

interface SessionStartInput extends CommonHookInput {
	hookEventName: "SessionStart";
	/** How the session was started. Currently always "new". */
	source: "new";
}

interface SessionStartOutput extends CommonHookOutput {
	hookSpecificOutput?: {
		hookEventName?: "SessionStart";
		/** Context added to the agent's conversation */
		additionalContext?: string;
	};
}

interface UserPromptSubmitInput extends CommonHookInput {
	hookEventName: "UserPromptSubmit";
	/** The text the user submitted */
	prompt: string;
}

interface UserPromptSubmitOutput extends CommonHookOutput {}

interface PreToolUseInput<ToolType extends keyof BuiltInToolTypeMap>
	extends CommonHookInput {
	hookEventName: "PreToolUse";
	/** The name of the tool being invoked */
	tool_name: ToolType;
	/** The input provided to the tool */
	tool_input: BuiltInToolTypeMap[ToolType];
	/** Unique identifier for this tool invocation */
	tool_use_id: string;
}

interface PreToolUseOutput<ToolType extends keyof BuiltInToolTypeMap>
	extends CommonHookOutput {
	hookSpecificOutput?: {
		hookEventName?: "PreToolUse";
		/** Controls tool approval */
		permissionDecision?: "allow" | "deny" | "ask";
		/** Reason shown to user */
		permissionDecisionReason?: string;
		/** Modified tool input (optional) */
		updatedInput?: BuiltInToolTypeMap[ToolType];
		/** Extra context for the model */
		additionalContext?: string;
	};
}

interface PostToolUseInput<ToolType extends keyof BuiltInToolTypeMap>
	extends CommonHookInput {
	hookEventName: "PostToolUse";
	/** The name of the tool that was invoked */
	tool_name: ToolType;
	/** The input provided to the tool */
	tool_input: BuiltInToolTypeMap[ToolType];
	/** Unique identifier for this tool invocation */
	tool_use_id: string;
	/** The response from the tool */
	tool_response: string;
}

interface PostToolUseOutput extends CommonHookOutput {
	/** Block further processing (optional) */
	decision?: "block";
	/** Reason for blocking (shown to the model) */
	reason?: string;
	hookSpecificOutput?: {
		hookEventName?: "PostToolUse";
		/** Extra context injected into the conversation */
		additionalContext?: string;
	};
}

interface PreCompactInput extends CommonHookInput {
	hookEventName: "PreCompact";
	/** How the compaction was triggered. "auto" when the conversation is too long for the prompt budget. */
	trigger: string;
}

interface PreCompactOutput extends CommonHookOutput {}

interface SubagentStartInput extends CommonHookInput {
	hookEventName: "SubagentStart";
	/** Unique identifier for the subagent */
	agent_id: string;
	/** The agent name (for example, "Plan" for built-in agents or custom agent names) */
	agent_type: string;
}

interface SubagentStartOutput extends CommonHookOutput {
	hookSpecificOutput?: {
		hookEventName?: "SubagentStart";
		/** Context added to the subagent's conversation */
		additionalContext?: string;
	};
}

interface SubagentStopInput extends CommonHookInput {
	hookEventName: "SubagentStop";
	/** Unique identifier for the subagent */
	agent_id: string;
	/** The agent name (for example, "Plan" for built-in agents or custom agent names) */
	agent_type: string;
	/** true when the subagent is already continuing as a result of a previous stop hook. Check this value to prevent the subagent from running indefinitely. */
	stop_hook_active: boolean;
}

interface SubagentStopOutput extends CommonHookOutput {
	/** Prevent the subagent from stopping */
	decision?: "block";
	/** Required when decision is "block". Tells the subagent why it should continue. */
	reason?: string;
}

interface StopInput extends CommonHookInput {
	hookEventName: "Stop";
	/** true when the agent is already continuing as a result of a previous stop hook. Check this value to prevent the agent from running indefinitely. */
	stop_hook_active: boolean;
}

interface StopOutput extends CommonHookOutput {
	hookSpecificOutput?: {
		hookEventName?: "Stop";
		/** Prevent the agent from stopping */
		decision?: "block";
		/** Required when decision is "block". Tells the agent why it should continue. */
		reason?: string;
	};
}
