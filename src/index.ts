import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Constants
const API_BASE_URL = "https://scarflike-prepositionally-azariah.ngrok-free.dev";

// Helper functions
function createSuccessResponse(data: any, customMessage?: string) {
	const text = customMessage || JSON.stringify(data, null, 2);
	return {
		content: [{ type: "text" as const, text }],
		isError: false
	};
}

function createErrorResponse(message: string) {
	return {
		content: [{ type: "text" as const, text: message }],
		isError: true
	};
}

async function makeApiCall(
	endpoint: string,
	body: Record<string, any>
) {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			return createErrorResponse(`Error: HTTP ${response.status} - ${response.statusText}`);
		}

		const data = await response.json();
		console.log(data);
		return createSuccessResponse(data);
	} catch (error) {
		return createErrorResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Zensho",
		version: "1.0.0",
	});

	async init() {
		// Browse tool that calls Zensho API
		this.server.tool(
			"browse", 
			{ 
				url: z.string().describe("The URL or key to browse. Supports: Jira issue URL/key (e.g., ZEN2025-2651), Backlog URL/key, Teams message URL"),
				oneCommentOnly: z.boolean().optional().describe("If response data is too large (ResponseTooLargeError), set to true to fetch less data. Default: false")
			},
			{
				description: `Browse and fetch content from a URL using the Zensho API. Supports Jira issues, Backlog URLs/keys, and Teams messages. Can limit the number of comments with maxCommentNum parameter (default: 10).

Response format (200):
{
  "title": "Title of the issue/ticket or message",
  "content": "Main extracted content",
  "reference_links": "Extracted reference links within content",
  "comments": "Comments from related users (number depends on maxCommentNum)",
  "parentContent": "Parent content (for Teams thread starter)",
  "teamsUrl": "URL of Teams message if available (only when type is teams or when issue has link to Teams)",
  "assetsImageIds": ["image-id-1", "image-id-2"],
  "jiraKey": "ZEN2025-123" (if browsing Jira issue),
  "backlogKey": "DEV_ZET_APP-266" (if browsing Backlog issue),
  "backlogLatestContent": {
    "title": "Backlog issue title",
    "comments": "Latest comments from Backlog issue",
    "backlogKey": "DEV_ZET_APP-266"
  } (if browsing Jira issue with link to Backlog, can be null or empty object)
}

Error responses:
- 400: Invalid request (missing/wrong parameters)
- 500: Server error`
			},
			async ({ url, oneCommentOnly }) => {
				return makeApiCall('/api/common/browse', { url, oneCommentOnly: oneCommentOnly ?? false });
			}
		);

		// List handling ticket by app type
		this.server.tool(
			"listBacklogHandlingTickets",
			{
				appNo: z.string()
					.transform(val => val.toUpperCase())
					.describe("The app type to list backlog handling tickets for. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)")
			},
			{
				description: `List all backlog handling tickets for a specific app type (N, KN, SK, ZET, DMINI). Case-insensitive.

Response format (200):
{
  "tickets": [
    {
      "key": "DEV_N_APP-2993",
      "title": "Ticket title"
    }
  ],
  "num": 10
}

Error responses:
- 400: Bad request (missing or invalid appNo)
- 500: Server error`
			},
			async ({ appNo }) => {
				return makeApiCall('/api/backlog/listHandlingTickets', { appNo });
			}
		);

		// Reply backlog ticket
		this.server.tool(
			"replyBacklogTicket",
			{
				url: z.string().describe("The backlog ticket URL or key to reply to (e.g., DEV_005_SPO-7012)"),
				content: z.string().describe("The content of the comment to post"),
				shouldAssign: z.boolean().describe("Whether to assign the issue to the first person mentioned in the comment. If the ticket is still within your responsibility scope, set to false; otherwise set to true."),
				assetsImageIds: z.array(z.string()).optional().describe("Optional list of uploaded image IDs to attach to the reply"),
			},
			{
				description: `Reply to an existing backlog ticket with a comment. Requires the ticket URL/key and content.

	Response format (200):
	{
	  "message": "Comment posted successfully",
	  "commentUrl": "URL of the comment after posting",
	  "imageUrl": "URL of the screenshot image of the screen after commenting"
	}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ url, content, shouldAssign, assetsImageIds }) => {
				const body: Record<string, unknown> = { url, content, shouldAssign };
				if (assetsImageIds) body.assetsImageIds = assetsImageIds;
				return makeApiCall('/api/backlog/replyIssue', body);
			}
		);

		// Create backlog ticket
		this.server.tool(
			"createBacklogTicket",
			{
				title: z.string().describe("The title of the backlog issue"),
				description: z.string().describe("The detailed description of the backlog issue"),
				appNo: z.string()
					.transform(val => val.toUpperCase())
					.describe("The app type for the backlog issue. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)"),
				assetsImageIds: z.array(z.string()).optional().describe("Optional list of uploaded image IDs to attach when creating the issue"),
			},
			{
				description: `Create a new backlog ticket with a title, description, and app type (N, KN, SK, ZET, DMINI). Case-insensitive.

	Response format (200):
	{
	  "id": "DEV_KN-123",
	  "url": "https://zhdoa.backlog.jp/view/DEV_KN-123",
	  "title": "Issue title",
	  "description": "Issue description",
	  "appNo": "KN"
	}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ title, description, appNo, assetsImageIds }) => {
				const body: Record<string, unknown> = { title, description, appNo };
				if (assetsImageIds) body.assetsImageIds = assetsImageIds;
				return makeApiCall('/api/backlog/createIssue', body);
			}
		);

		// Create Jira ticket
		this.server.tool(
			"createJiraTicket",
			{
				title: z.string().describe("The title of the Jira issue"),
				description: z.string().describe("The detailed description of the Jira issue"),
				type: z.string()
					.transform(val => val.toUpperCase())
					.describe("The app type for the Jira issue. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)"),
			},
			{
				description: `Create a new Jira ticket with a title, description, and type (N, KN, SK, ZET, DMINI). Case-insensitive.

Response format (200):
{
  "message": "Issue created successfully",
  "issueUrl": "https://pm.gem-corp.tech/browse/ZEN2025-1234"
}

Error responses:
- 400: Invalid request
- 500: Server error`
			},
			async ({ title, description, type }) => {
				return makeApiCall('/api/jira/createIssue', { title, description, type });
			}
		);

		// Reply Jira ticket
		this.server.tool(
			"replyJiraTicket",
			{
				url: z.string().describe("The Jira ticket URL or key to reply to (e.g., https://pm.gem-corp.tech/browse/ZEN2025-1197 or ZEN2025-1197)"),
				content: z.string().describe("The content of the comment to post"),
				assetsImageIds: z.array(z.string()).optional().describe("Optional list of uploaded image IDs to attach to the reply"),
			},
			{
				description: `Reply to an existing Jira ticket with a comment. Requires the ticket URL/key and reply content.

Response format (200):
{
  "message": "Comment posted successfully",
  "url": "https://pm.gem-corp.tech/browse/ZEN2025-1197",
  "content": "Reply content",
  "commentUrl": "URL of the comment after posting",
  "imageUrl": "URL of the screenshot image of the screen after commenting",
  "suggestReplyMember": "Name of suggested member to reply (extracted from latest comment or assigned person)"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ url, content, assetsImageIds }) => {
				const body: Record<string, unknown> = { url, content };
				if (assetsImageIds) body.assetsImageIds = assetsImageIds;
				return makeApiCall('/api/jira/replyIssue', body);
			}
		);
		
		// Search tool required by ChatGPT
		this.server.tool(
			"search",
			{
				query: z.string().describe("The search query to find tickets (e.g., version number like 1.1.1, keywords like 'bug fix')"),
				appNo: z.string()
					.transform(val => val.toUpperCase())
					.describe("The app type to search tickets for. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)")
			},
			{
				description: `Search for tickets on Backlog based on text query and app type (N, KN, SK, ZET, DMINI). Returns list of matching tickets.

Response format (200):
[
  {
    "key": "DEV_ZET_APP-266",
    "title": "【ZET】アプリVer1.1.1リリース（IOS、AOS）"
  },
  {
    "key": "DEV_ZET_APP-265",
    "title": "【ZET】Bug fix cho tính năng đăng nhập"
  }
]

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ query, appNo }) => {
				return makeApiCall('/api/data/search', { text: query, appNo });
			},
		);

		// Read first unread notification from Backlog
		this.server.tool(
			"readFirstUnreadNotification",
			{},
			{
				description: `Read the first unread notification from Backlog. Automatically opens Backlog, logs in, clicks the first unread notification and extracts issue information.

Response format (200):
{
  "title": "Issue title",
  "content": "Main extracted content",
  "reference_links": "Extracted reference links",
  "comments": "Comments content",
  "parentContent": "Parent content if available",
  "issueKey": "DEV_ZET_APP-266"
}

Error responses:
- 500: Server error`
			},
			async () => {
				return makeApiCall('/api/backlog/readFirstUnreadNotification', {});
			}
		);

		// Read all notifications from Backlog
		this.server.tool(
			"readAllNotifications",
			{},
			{
				description: `Read all notifications from Backlog. Automatically opens Backlog, logs in, opens notification list and extracts content of all notifications.

Response format (200):
{
  "notifications": [
    {
      "content": "Notification content",
      "issueKey": "DEV_ZET_APP-266"
    }
  ]
}

Error responses:
- 500: Server error`
			},
			async () => {
				return makeApiCall('/api/backlog/readAllNotifications', {});
			}
		);

		// Reply in Teams
		this.server.tool(
			"replyInTeams",
			{
				text: z.string().describe("The content of the message to reply in Teams"),
				url: z.string().optional().describe("URL of the Teams message thread to reply to (required if mentionNo is not provided)"),
				mentionNo: z.string().optional().describe("Mention number of the Teams message in mention list (required if url is not provided)")
			},
			{
				description: `Reply to a message in Microsoft Teams thread. Requires either url or mentionNo (at least one).

Response format (200):
{
  "message": "Reply sent successfully",
  "url": "https://teams.microsoft.com/l/message/...",
  "text": "Reply content"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ text, url, mentionNo }) => {
				const body: any = { text };
				if (url) body.url = url;
				if (mentionNo) body.mentionNo = mentionNo;
				return makeApiCall('/api/teams/replyInTeams', body);
			}
		);

		// Read mentions from Teams
		this.server.tool(
			"readMentions",
			{},
			{
				description: `Read all mentions from Microsoft Teams Activity tab.

Response format (200):
Array of all mentions (ReadAllMentionsResponse):
[
  {
    "mentionNo": 1,
    "id": "activity-feed-item-1",
    "author": null,
    "timestamp": null,
    "content": "Thông báo về việc release",
    "images": null
  },
  {
    "mentionNo": 2,
    "id": "activity-feed-item-2",
    "author": null,
    "timestamp": null,
    "content": "Thông báo về việc sửa lỗi",
    "images": null
  }
]

Error responses:
- 400: Invalid request
- 500: Server error`
			},
			async () => {
				return makeApiCall('/api/teams/readMentions', {});
			}
		);

		// Read message from mention by number or ID
		this.server.tool(
			"readMessageFromMention",
			{
				mentionNo: z.number().min(1).optional().describe("The mention number to read (1: first mention, 2: second mention, etc.). Required if mentionId is not provided."),
				mentionId: z.string().optional().describe("The ID of the mention to read. Required if mentionNo is not provided.")
			},
			{
				description: `Read a specific mention by its number or ID from Microsoft Teams Activity tab. Opens Activity tab, selects mention by mentionNo or mentionId and returns detailed content. At least one of mentionNo or mentionId must be provided.

Response format (200):
{
  "title": "Tiêu đề message",
  "content": "Nội dung message được trích xuất...",
  "reference_links": "Các liên kết tham chiếu...",
  "comments": "Nội dung comments...",
  "parentContent": "Nội dung cha (message bắt đầu thread)...",
  "teamsUrl": "https://teams.microsoft.com/l/message/..."
}

Error responses:
- 400: Invalid request (missing or wrong mentionNo/mentionId)
- 500: Server error`
			},
			async ({ mentionNo, mentionId }) => {
				const body: Record<string, unknown> = {};
				if (mentionNo) body.mentionNo = mentionNo;
				if (mentionId) body.mentionId = mentionId;
				return makeApiCall('/api/teams/readMessageFromMention', body);
			}
		);

		// Read threads from Teams channel
		this.server.tool(
			"readThreads",
			{
				channelName: z.string().describe("The Teams channel name to read threads from. Allowed values: KN, SK, ZET, N, DMINI, GENERAL")
			},
			{
				description: `Read list of threads from a Microsoft Teams channel. Automatically scrolls up to load at least 10 threads if initially fewer than 10.

Response format (200):
[
  {
    "threadId": "123456",
    "author": "Nguyễn Văn A",
    "timestamp": "10:30 AM",
    "subject": "Thread subject",
    "content": "Thread content",
    "latest_replyies": [
      {
        "replyId": "789012",
        "replyAuthor": "Nguyễn Văn B",
        "replyTimestamp": "10:35 AM",
        "replyContent": "Reply content"
      }
    ]
  }
]

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ channelName }) => {
				return makeApiCall('/api/teams/readThreads', { channelName });
			}
		);

		// Create thread in Teams channel
		this.server.tool(
			"createThread",
			{
				title: z.string().describe("The title of the thread/post"),
				content: z.string().describe("The content of the thread/post"),
				channelName: z.string().describe("The Teams channel name to create thread in. Allowed values: KN, SK, ZET, N, DMINI, GENERAL")
			},
			{
				description: `Create a new thread/post in a Microsoft Teams channel with specified title and content.

Response format (200):
{
  "message": "Successfully created post in Teams channel",
  "title": "Thread title",
  "content": "Thread content"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ title, content, channelName }) => {
				return makeApiCall('/api/teams/createThread', { title, content, channelName });
			}
		);

		// Find Teams thread URL from ticket key
		this.server.tool(
			"findThread",
			{
				ticketKey: z.string().describe("Ticket key or URL (e.g., ZEN2025-1234, DEV_005_SPO-7012, or full URL of Jira/Backlog issue)"),
				appNo: z.enum(["SK", "KN", "N", "DMINI", "ZET"]).optional().describe("App type (SK, KN, N, DMINI, ZET). If thread is not found and appNo is provided, returns 5 most recent threads from appNo channel and 5 from GENERAL channel.")
			},
			{
				description: `Find Teams thread URL from ticket key. Searches for Teams thread URL in Google Sheets based on ticket key (Jira or Backlog key). Can accept full URL or just ticket key.

Response format (200):
If found:
{
  "message": "Thread Url found",
  "teamsUrl": "https://teams.microsoft.com/l/message/..."
}

If not found (without appNo):
{
  "message": "Thread Url not found",
  "teamsUrl": null
}

If not found (with appNo provided):
{
  "message": "Thread Url not found",
  "teamsUrl": null,
  "suggestionThreads": {
    "appThreads": [
      { "teamsUrl": "...", "title": "...", "summary": "...", "appNo": "KN" }
    ],
    "generalThreads": [
      { "teamsUrl": "...", "title": "...", "summary": "...", "appNo": "GENERAL" }
    ]
  }
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ ticketKey, appNo }) => {
				return makeApiCall('/api/teams/findThread', { ticketKey, appNo });
			}
		);

		// List Jira handling tickets by app type
		this.server.tool(
			"listJiraHandlingTickets",
			{
				url: z.string().describe("Jira project versions page URL (e.g., https://pm.gem-corp.tech/projects/ZEN2025/versions)"),
				appNo: z.string().describe("App type to filter versions by (e.g., ZET, KN, SK, Mini)")
			},
			{
				description: `List all Jira handling tickets by extracting issues from versions matching the specified app type. Navigates to Jira project versions page and extracts all issues from matching versions.

Response format (200):
{
  "success": true,
  "issues": [
    {
      "ticketName": "ZEN2025-123",
      "ticketStatus": "Done",
      "ticketUrl": "https://pm.gem-corp.tech/browse/ZEN2025-123",
      "versionName": "ZET_next_version",
      "key": "ZEN2025-123"
    }
  ]
}

Error responses:
- 400: Invalid request (missing url or appNo)
- 500: Server error`
			},
			async ({ url, appNo }) => {
				return makeApiCall('/api/jira/listHandlingTickets', { url, appNo });
			}
		);

		// Take screenshot of current selenium web page
		this.server.tool(
			"getScreenShot",
			{},
			{
				description: `Take a screenshot of the current web page opened by Selenium and return the image URL.

Response format (200):
{
  "message": "Screenshot taken",
  "imageUrl": "https://res.cloudinary.com/.../screenshot.png"
}

Error responses:
- 400: Bad request
- 500: Server error`
			},
			async () => {
				return makeApiCall('/manage/getScreenShot', {});
			}
		);

		// Fix code using Claude CLI based on error logs
		this.server.tool(
			"fixCode",
			{
				apiName: z.string().optional().describe("Name of the API endpoint to fix (e.g., replyIssueAction). Optional, defaults to empty string"),
				extraInfo: z.string().optional().describe("Additional information to pass to the batch file. Optional, defaults to empty string")
			},
			{
				description: `Fix code using Claude CLI based on error logs. Invokes Claude CLI to read error logs and automatically fix code issues. Waits for the process to complete (with 10 minute timeout).

Response format (200):
{
  "message": "fixCode.bat completed successfully" or "fixCode.bat completed with errors",
  "exitCode": 0 (success) or non-zero (error),
  "stdout": "Command output...",
  "stderr": "Error messages...",
  "batchFile": "D:/workspace/personal-app/fixCode.bat"
}

Error responses:
- 400: Bad request
- 500: Server error`
			},
			async ({ apiName, extraInfo }) => {
				const body: Record<string, unknown> = {};
				if (apiName) body.apiName = apiName;
				if (extraInfo) body.extraInfo = extraInfo;
				return makeApiCall('/manage/fixCode', body);
			}
		);

		// Register lesson learned to Google Sheets
		this.server.tool(
			"registerLessonLearned",
			{
				context: z.string().describe("Context/situation where the lesson was learned (e.g., 'Handling async operations in Playwright')"),
				bad: z.string().describe("Bad practice that was used (e.g., 'Using .last(10) method that does not exist')"),
				why: z.string().describe("Why that approach was bad (e.g., 'Playwright does not have .last() method for locators')"),
				good: z.string().describe("Good practice to follow instead (e.g., 'Use .nth() with loop to get the last items')"),
				lessionLearn: z.string().describe("The lesson learned to remember (e.g., 'Always check Playwright API documentation before using new methods')"),
				scope: z.enum(['vn', 'jp']).optional().describe("Scope of the lesson (vn, jp). Optional")
			},
			{
				description: `Register a lesson learned to Google Sheets to avoid similar issues in the future. Records the context, bad practice, reason why it's bad, good practice, the lesson learned, and optional scope.

Response format (200):
{
  "success": true,
  "message": "Lesson learned đã được ghi lại thành công"
}

Error responses:
- 400: Invalid request (missing parameters)
- 500: Server error`
			},
			async ({ context, bad, why, good, lessionLearn, scope }) => {
				const body: Record<string, unknown> = { context, bad, why, good, lessionLearn };
				if (scope) body.scope = scope;
				return makeApiCall('/api/common/lessionLearn', body);
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
