import type { Prettify } from "./helpers";

export type BuiltInToolTypeMap = CommonToolTypes &
	ClaudeSpecificToolTypes &
	CodexSpecificToolTypes;

export type CommonToolTypes = {
	create_file: {
		/** The absolute path to the file to create. */
		filePath: string;
		/** The content to write to the file. */
		content: string;
	};
	file_search: {
		/** Search for files with names or paths matching this glob pattern. */
		query: string;
		/** The maximum number of results to return. */
		maxResults?: number;
	};
	grep_search: {
		/** The pattern to search for in files in the workspace. Use regex with alternation (e.g., 'word1|word2|word3') to find multiple potential words in a single search. Is case-insensitive. */
		query: string;
		/** Whether the pattern is a regex. */
		isRegexp: boolean;
		/** Whether to include files that would normally be ignored according to .gitignore, other ignore files and `files.exclude` and `search.exclude` settings. */
		includeIgnoredFiles?: boolean;
		/** Search files matching this glob pattern. Will be applied to the relative path of files within the workspace. Do not use | in includePattern. */
		includePattern?: string;
		/** The maximum number of results to return. */
		maxResults?: number;
	};
	get_errors: {
		/** The absolute paths to the files or folders to check for errors. Omit when retrieving all errors. */
		filePaths?: string[];
	};
	list_dir: {
		/** The absolute path to the directory to list. */
		path: string;
	};
	memory: {
		/** The operation to perform on the memory file system. */
		command: "view" | "create" | "str_replace" | "insert" | "delete" | "rename";
		/** The absolute path to the file or directory inside /memories/, e.g. "/memories/notes.md". Used by all commands except `rename`. */
		path?: string;
		/** Required for `create`. The content of the file to create. */
		file_text?: string;
		/** Required for `str_replace`. The exact string in the file to replace. Must appear exactly once. */
		old_str?: string;
		/** Required for `str_replace`. The new string to replace old_str with. */
		new_str?: string;
		/** Required for `insert`. The 0-based line number to insert text at. 0 inserts before the first line. */
		insert_line?: number;
		/** Required for `insert`. The text to insert at the specified line. */
		insert_text?: string;
		/** Required for `rename`. The current path of the file or directory to rename. */
		old_path?: string;
		/** Required for `rename`. The new path for the file or directory. */
		new_path?: string;
		/** Optional for `view`. A two-element array [start_line, end_line] (1-indexed) to view a specific range of lines. */
		view_range?: [number, number];
	};
	read_file: {
		/** The absolute path of the file to read. */
		filePath: string;
		/** The line number to start reading from, 1-based. */
		startLine: number;
		/** The inclusive line number to end reading at, 1-based. */
		endLine: number;
	};
	run_in_terminal: {
		/** The command to run in the terminal. */
		command: string;
		/** A one-sentence description of what the command does. This will be shown to the user before the command is run. */
		explanation: string;
		/** A short description of the goal or purpose of the command (e.g., "Install dependencies", "Start development server"). */
		goal: string;
		/** Whether the command starts a background process. */
		isBackground: boolean;
		/** An optional timeout in milliseconds. Use 0 for no timeout. */
		timeout?: number;
	};
	get_terminal_output: {
		/** The ID of the terminal to check. */
		id: string;
	};
	manage_todo_list: {
		/** Complete array of all todo items. Must include ALL items - both existing and new. */
		todoList: Array<{
			/** Unique identifier for the todo. Use sequential numbers starting from 1. */
			id: number;
			/** Concise action-oriented todo label (3-7 words). Displayed in UI. */
			title: string;
			/** not-started: Not begun | in-progress: Currently working (max 1) | completed: Fully finished with no blockers */
			status: "not-started" | "in-progress" | "completed";
		}>;
	};
	semantic_search: {
		/** The query to search the codebase for. Should contain all relevant context. Should ideally be text that might appear in the codebase, such as function names, variable names, or comments. */
		query: string;
	};
	runSubagent: {
		/** A detailed description of the task for the agent to perform. */
		prompt: string;
		/** A short (3-5 word) description of the task. */
		description: string;
		/** Optional name of a specific agent to invoke. If not provided, uses the current agent. */
		agentName?: string;
	};
	search_subagent: {
		/** Natural language description of what to search for. */
		query: string;
		/** A short (3-5 word) description of the task. */
		description: string;
		/** A more detailed description of the objective for the search subagent. */
		details: string;
	};

	// Deferred tools
	await_terminal: {
		/** The ID of the terminal to await (returned by run_in_terminal when isBackground=true). */
		id: string;
		/** Timeout in milliseconds. If the command does not complete within this time, returns the output collected so far with a timeout indicator. Use 0 for no timeout. */
		timeout: number;
	};
	copilot_getNotebookSummary: {
		/** An absolute path to the notebook file with the cell to run, or the URI of a untitled, not yet named, file, such as `untitled:Untitled-1.ipynb` */
		filePath: string;
	};
	create_and_run_task: {
		/** The task to add to the new tasks.json file. */
		task: {
			/** The label of the task. */
			label: string;
			/** The type of the task. The only supported value is 'shell'. */
			type: "shell";
			/** The shell command to run for the task. */
			command: string;
			/** The arguments to pass to the command. */
			args?: string[];
			/** The group to which the task belongs. */
			group?: string;
			/** Whether the task runs in the background without blocking the UI or other tasks. */
			isBackground?: boolean;
			/** The problem matcher to use to parse task output for errors and warnings. */
			problemMatcher?: string[];
		};
		/** The absolute path of the workspace folder where the tasks.json file will be created. */
		workspaceFolder: string;
	};
	create_directory: {
		/** The absolute path to the directory to create. */
		dirPath: string;
	};
	create_new_jupyter_notebook: {
		/** A clear and concise description of the notebook the user wants to create. */
		query: string;
	};
	create_new_workspace: {
		/** A clear and concise description of the workspace the user wants to create. */
		query: string;
	};
	edit_notebook_file: {
		/** An absolute path to the notebook file to edit, or the URI of a untitled, not yet named, file. */
		filePath: string;
		/** The operation performed on the cell: `insert` to add a new cell, `edit` to modify an existing cell's content, and `delete` to remove a cell. */
		editType: "insert" | "delete" | "edit";
		/** Id of the cell that needs to be deleted or edited. Use `TOP` or `BOTTOM` when inserting at the top or bottom of the notebook. */
		cellId: string;
		/** The language of the cell, e.g. `markdown`, `python`, `javascript`. */
		language?: string;
		/** The code for the new or existing cell to be edited. */
		newCode?: string | string[];
	};
	fetch_webpage: {
		/** An array of URLs to fetch content from. */
		urls: string[];
		/** A clear and concise description of the content you want to find. */
		query: string;
	};
	get_changed_files: {
		/** The absolute path to the git repository to look for changes in. If not provided, the active git repository will be used. */
		repositoryPath?: string;
		/** The kinds of git state to filter by. Allowed values are: 'staged', 'unstaged', and 'merge-conflicts'. If not provided, all states will be included. */
		sourceControlState?: Array<"staged" | "unstaged" | "merge-conflicts">;
	};
	get_project_setup_info: {
		/** The type of project to create. Supported values are: 'python-script', 'python-project', 'mcp-server', 'model-context-protocol-server', 'vscode-extension', 'next-js', 'vite' and 'other'. */
		projectType: string;
	};
	get_search_view_results: Record<string, never>;
	get_vscode_api: {
		/** The query to search vscode documentation for. Should contain all relevant context. */
		query: string;
	};
	github_repo: {
		/** The name of the GitHub repository to search for code in, formatted as '<owner>/<repo>'. */
		repo: string;
		/** The query to search for. Should contain all relevant context. */
		query: string;
	};
	install_extension: {
		/** The ID of the extension to install, in the format <publisher>.<extension>. */
		id: string;
		/** The name of the extension to install. */
		name: string;
	};
	kill_terminal: {
		/** The ID of the background terminal to kill (returned by run_in_terminal when isBackground=true). */
		id: string;
	};
	open_browser_page: {
		/** The full URL to open in the browser. */
		url: string;
	};
	run_notebook_cell: {
		/** An absolute path to the notebook file with the cell to run. */
		filePath: string;
		/** The ID for the code cell to execute. */
		cellId: string;
		/** Whether or not execution should continue for remaining cells if an error is encountered. Default to false. */
		continueOnError?: boolean;
		/** An optional explanation of why the cell is being run. */
		reason?: string;
	};
	run_vscode_command: {
		/** The ID of the command to execute, in the format <command>. */
		commandId: string;
		/** The name of the command to execute. */
		name: string;
		/** The arguments to pass to the command. */
		args?: string[];
		/** If true, skip checking whether the command exists before executing it. */
		skipCheck?: boolean;
	};
	terminal_last_command: Record<string, never>;
	terminal_selection: Record<string, never>;
	test_failure: Record<string, never>;
	vscode_askQuestions: {
		/** List of questions to ask the user. Order is preserved. */
		questions: Array<{
			/** Short identifier for the question. Must be unique. */
			header: string;
			/** The question text to display to the user. */
			question: string;
			/** Optional list of selectable answers. */
			options?: Array<{
				/** Display label and value for the option. */
				label: string;
				/** Optional secondary text shown with the option. */
				description?: string;
				/** Mark this option as the recommended default. */
				recommended?: boolean;
			}>;
			/** Allow selecting multiple options when options are provided. */
			multiSelect?: boolean;
			/** Allow freeform text answers in addition to option selection. */
			allowFreeformInput?: boolean;
		}>;
	};
	vscode_listCodeUsages: {
		/** The exact name of the symbol (function, class, method, variable, type, etc.) to find usages of. */
		symbol: string;
		/** A substring of the line of code where the symbol appears. Must be actual text from the file. */
		lineContent: string;
		/** A full URI of a file where the symbol appears. Provide either "uri" or "filePath". */
		uri?: string;
		/** A workspace-relative file path where the symbol appears. Provide either "uri" or "filePath". */
		filePath?: string;
	};
	vscode_renameSymbol: {
		/** The exact current name of the symbol to rename. */
		symbol: string;
		/** The new name for the symbol. */
		newName: string;
		/** A substring of the line of code where the symbol appears. Must be actual text from the file. */
		lineContent: string;
		/** A full URI of a file where the symbol appears. Provide either "uri" or "filePath". */
		uri?: string;
		/** A workspace-relative file path where the symbol appears. Provide either "uri" or "filePath". */
		filePath?: string;
	};
	vscode_searchExtensions_internal: {
		/** The category of extensions to search for. */
		category?:
			| "AI"
			| "Azure"
			| "Chat"
			| "Data Science"
			| "Debuggers"
			| "Extension Packs"
			| "Education"
			| "Formatters"
			| "Keymaps"
			| "Language Packs"
			| "Linters"
			| "Machine Learning"
			| "Notebooks"
			| "Programming Languages"
			| "SCM Providers"
			| "Snippets"
			| "Testing"
			| "Themes"
			| "Visualization"
			| "Other";
		/** The ids of the extensions to search for. */
		ids?: string[];
		/** The keywords to search for. */
		keywords?: string[];
	} & ClaudeSpecificToolTypes &
		CodexSpecificToolTypes;
};

export type ClaudeSpecificToolTypes = {
	tool_search_tool_regex: {
		/** Python regex pattern (re.search) to match against tool names, descriptions, and parameters. Case-insensitive by default. Maximum 200 characters. */
		pattern: string;
		/** Maximum number of matching tools to return (default: 5) */
		limit?: number;
	};
	multi_replace_string_in_file: {
		/** A brief explanation of what the multi-replace operation will accomplish. */
		explanation: string;
		/** An array of replacement operations to apply sequentially. */
		replacements: Array<{
			/** An absolute path to the file to edit. */
			filePath: string;
			/** The exact literal text to replace. Include at least 3 lines of context before and after the target text. */
			oldString: string;
			/** The exact literal text to replace `oldString` with. */
			newString: string;
		}>;
	};
	replace_string_in_file: {
		/** An absolute path to the file to edit. */
		filePath: string;
		/** The exact literal text to replace. Include at least 3 lines of context before and after the target text. */
		oldString: string;
		/** The exact literal text to replace `oldString` with. */
		newString: string;
	};
};

export type CodexSpecificToolTypes = {
	apply_patch: Prettify<
		{
			/** The edit patch to apply. */
			input: string;
			/** A short description of what the tool call is aiming to achieve. */
			explanation: string;
			// Normalize Apply Patch input to match Claude tool format
		} & Partial<ClaudeSpecificToolTypes["replace_string_in_file"]>
	>;
	parallel: {
		/** The tools to be executed in parallel. */
		tool_uses: ParallelToolUseList<keyof BuiltInToolTypeMap>;
	};
};

export type ParallelToolUseList<ToolType extends keyof BuiltInToolTypeMap> = {
	/** The name of the tool to use. The format must be <tool_name>.<function_name>. */
	recipient_name: ToolType;
	/** The parameters to pass to the tool. Ensure these are valid according to that tool's own specifications. */
	parameters: BuiltInToolTypeMap[ToolType];
}[];
