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
				description: `Browse and fetch content from a URL using the Zensho API. Supports Jira issues, Backlog URLs/keys, and Teams messages.

Response format (200):
{
  "content": "Main extracted content",
  "reference_links": "Extracted reference links within content",
  "comments": "Comments from related users",
  "parentContent": "Parent content (for Teams thread starter)"
}

Error responses:
- 400: Invalid request (missing/wrong parameters)
- 500: Server error`
			},
			async ({ url, oneCommentOnly }) => {
				return makeApiCall('/zensho/browse', { url, oneCommentOnly: oneCommentOnly ?? false });
			}
		);

        //List handling ticket by app type
		this.server.tool(
			"listBacklogHandlingTickets",
			{
				appType: z.string()
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
- 400: Bad request (missing or invalid appType)
- 500: Server error`
			},
			async ({ appType }) => {
				return makeApiCall('/zensho/listBacklogHandlingTickets', { appType });
			}
		);

		//reply backlog ticket
		this.server.tool(
			"replyBacklogTicket",
			{
				url: z.string().describe("The backlog ticket URL or key to reply to (e.g., DEV_005_SPO-7012)"),
				content: z.string().describe("The content of the comment to post"),
			},
			{
				description: `Reply to an existing backlog ticket with a comment. Requires the ticket URL/key and content.

Response format (200):
{
  "message": "Comment posted successfully",
  "commentUrl": "URL of the comment after posting",
  "imageUrl": "URL of the Screenshot image of the screen after commenting",
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ url, content }) => {
				const body: any = { url, content };
				return makeApiCall('/api/backlog/replyIssue', body);
			}
		);

		//create backlog ticket
		this.server.tool(
			"createBacklogTicket",
			{
				title: z.string().describe("The title of the backlog issue"),
				description: z.string().describe("The detailed description of the backlog issue"),
				appType: z.string()
					.transform(val => val.toUpperCase())
					.describe("The app type for the backlog issue. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)"),
			},
			{
				description: `Create a new backlog ticket with a title, description, and app type (N, KN, SK, ZET, DMINI). Case-insensitive.

Response format (200):
{
  "issueKey": "DEV_N_APP-2967",
  "message": "Additional status message (optional)"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ title, description, appType }) => {
				return makeApiCall('/api/backlog/createIssue', { title, description, appType });
			}
		);

		//create jira ticket
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
  "message": "Success message",
  "issueUrl": "https://pm.gem-corp.tech/browse/ZEN2025-XXXX"
}

Error responses:
- 400: Invalid request
- 500: Server error`
			},
			async ({ title, description, type }) => {
				return makeApiCall('/zensho/createJiraIssue', { title, description, type });
			}
		);

		//reply ticket jira 
		this.server.tool(
			"replyJiraTicket",
			{
				url: z.string().describe("The Jira ticket URL or key to reply to (e.g., https://pm.gem-corp.tech/browse/ZEN2025-1197 or ZEN2025-1197)"),
				content: z.string().describe("The content of the comment to post"),
				imageUrl: z.string().optional().describe("Screenshot image URL to attach to the comment"),
			},
			{
				description: `Reply to an existing Jira ticket with a comment. Requires the ticket URL/key and reply content.

Response format (200):
{
  "message": "Comment posted successfully",
  "commentUrl": "URL of the comment after posting"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ url, content, imageUrl }) => {
				const body: any = { url, content };
				if (imageUrl) body.imageUrl = imageUrl;
				return makeApiCall('/zensho/replyJiraIssue', body);
			}
		);
		
		// Search tool required by ChatGPT
		this.server.tool(
			"search",
			{
				query: z.string().describe("The search query to find documents/issues (e.g., version number, keywords)"),
			},
			{
				description: `Search for documents and issues using a text query.

Response format (200):
[
  {
    "id": "DEV_ZET_APP-266",
    "title": "Document or issue title",
    "url": "https://zhdoa.backlog.jp/view/DEV_ZET_APP-266"
  }
]

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`
			},
			async ({ query }) => {
				return makeApiCall('/api/documents/searchShort', { text: query });
			},
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
