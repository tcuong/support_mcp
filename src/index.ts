import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Zensho Support",
		version: "1.0.0",
	});

	async init() {
		// Browse tool that calls Zensho API
		this.server.tool(
			"browse", 
			{ url: z.string().describe("The URL to browse") },
			{
				description: "Browse and fetch content from a URL using the Zensho API. Returns the scraped content and metadata."
			},
			async ({ url }) => {
			try {
				const response = await fetch('https://scarflike-prepositionally-azariah.ngrok-free.dev/zensho/browse', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						url: url,
						oneCommentOnly: false
					})
				});

				if (!response.ok) {
					return {
						content: [{
							type: "text",
							text: `Error: HTTP ${response.status} - ${response.statusText}`
						}]
					};
				}

				const data = await response.json();
				console.log(data);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(data, null, 2)
					}]
				};
			} catch (error) {
				return {
					content: [{
						type: "text",
						text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
					}]
				};
			}
		});

        //List handling ticket by app type
		this.server.tool(
			"listBacklogHandlingTickets",
			{
				appType: z.string().describe("The app type to list backlog handling tickets for")
			},
			async ({ appType }) => {
				const response = await fetch('https://scarflike-prepositionally-azariah.ngrok-free.dev/zensho/listBacklogHandlingTickets', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						appType: appType
					})
				});

				if (!response.ok) {
					return {
						content: [{
							type: "text",
							text: `Error: HTTP ${response.status} - ${response.statusText}`
						}]
					};
				}

				const data = await response.json();
				console.log(data);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(data, null, 2)
					}]
				};
			}
		);

		//reply backlog ticket, forward to this curl: 
		//		curl --location 'https://scarflike-prepositionally-azariah.ngrok-free.dev/api/backlog/replyIssue' \
//--header 'Content-Type: application/json' \
//--data-raw '{"url":"https://zhdoa.backlog.jp/view/DEV_005_SPO-7073","content":""}'
		this.server.tool(
			"replyBacklogTicket",
			{
				url: z.string().describe("The backlog ticket ID to reply to"),
				reply: z.string().describe("The reply to the backlog ticket"),
			},
			async ({ url, reply }) => {
				const response = await fetch('https://scarflike-prepositionally-azariah.ngrok-free.dev/api/backlog/replyIssue', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						url: url,
						content: reply
					})
				});

				if (!response.ok) {
					return {
						content: [{
							type: "text",
							text: `Error: HTTP ${response.status} - ${response.statusText}`
						}]
					};
				}

				const data = await response.json();
				console.log(data);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(data, null, 2)
					}]
				};
			}
		);

		//create backlog ticket, forward to this curl: //curl --location 'https://scarflike-prepositionally-azariah.ngrok-free.dev/api/backlog/createIssue' \
//--header 'Content-Type: application/json' \
//--data '{
//    "title": "AAAA", 
//    "description": " ", 
//    "appType": "SK"
//}'
		this.server.tool(
			"createBacklogTicket",
			{
				title: z.string().describe("The title of the backlog ticket"),
				description: z.string().describe("The description of the backlog ticket"),
				appType: z.string().describe("The app type of the backlog ticket"),
			},
			async ({ title, description, appType }) => {
				const response = await fetch('https://scarflike-prepositionally-azariah.ngrok-free.dev/api/backlog/createIssue', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						title: title,
						description: description,
						appType: appType
					})
				});

				if (!response.ok) {
					return {
						content: [{
							type: "text",
							text: `Error: HTTP ${response.status} - ${response.statusText}`
						}]
					};
				}

				const data = await response.json();
				console.log(data);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(data, null, 2)
					}]
				};
			}
		);

		//create jira ticket, forward to this curl: curl --location 'https://scarflike-prepositionally-azariah.ngrok-free.dev/zensho/createJiraIssue' \
// --header 'Content-Type: application/json' \
// --data '{
//     "title": "AAAAA",
//     "description": "BBBBB",
//     "type": "KN"
// }'
		this.server.tool(
			"createJiraTicket",
			{
				title: z.string().describe("The title of the jira ticket"),
				description: z.string().describe("The description of the jira ticket"),
				type: z.string().describe("The type of the jira ticket"),
			},
			async ({ title, description, type }) => {
				const response = await fetch('https://scarflike-prepositionally-azariah.ngrok-free.dev/zensho/createJiraIssue', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						title: title,
						description: description,
						type: type
					})
				});

				if (!response.ok) {
					return {
						content: [{
							type: "text",
							text: `Error: HTTP ${response.status} - ${response.statusText}`
						}]
					};
				}

				const data = await response.json();
				console.log(data);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(data, null, 2)
					}]
				};
			}
		);

		//reply ticket jira follow this curl:
// 		curl --location 'https://scarflike-prepositionally-azariah.ngrok-free.dev/zensho/replyJiraIssue' \
// --header 'Content-Type: application/json' \
// --data '{
//     "url": "https://pm.gem-corp.tech/browse/ZEN2025-1197",
//     "content": "AAAAA"
// }'   
		this.server.tool(
			"replyJiraTicket",
			{
				url: z.string().describe("The url of the jira ticket to reply to"),
				content: z.string().describe("The content of the reply to the jira ticket"),
			},
			async ({ url, content }) => {
				const response = await fetch('https://scarflike-prepositionally-azariah.ngrok-free.dev/zensho/replyJiraIssue', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						url: url,
						content: content
					})
				});

				if (!response.ok) {
					return {
						content: [{
							type: "text",
							text: `Error: HTTP ${response.status} - ${response.statusText}`
						}]
					};
				}

				const data = await response.json();
				console.log(data);
				return {
					content: [{
						type: "text",
						text: JSON.stringify(data, null, 2)
					}]
				};
			}
		);
		
		// Search tool required by ChatGPT
		this.server.tool(
			"search",
			{
				query: z.string().describe("The search query to find information"),
			},
			async ({ query }) => {
				// This is a basic implementation - you can enhance it to search actual data sources
				const mockResults = [
					{
						title: `Search results for: ${query}`,
						content: `This is a mock search result for the query "${query}". In a real implementation, this would search through your actual data sources like databases, APIs, or file systems.`,
						url: "#",
					},
					{
						title: "Additional search result",
						content: `Another mock result for "${query}". You can implement actual search functionality here based on your needs.`,
						url: "#",
					},
				];

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								query,
								results: mockResults,
								total: mockResults.length,
							}, null, 2),
						},
					],
				};
			},
		);

		//implemnent fetch tool required by chatgpt
		this.server.tool(
			"fetch",
			{
				//need id parameter
				id: z.string().describe("The ID to fetch")
			},
			async ({ id }) => {
				//implement fetch tool
				return { content: [{ type: "text", text: JSON.stringify(id) }] };
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
