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
		// Simple addition tool
		this.server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
			content: [{ type: "text", text: String(a + b) }],
		}));

		// Calculator tool with multiple operations
		this.server.tool(
			"calculate",
			{
				operation: z.enum(["add", "subtract", "multiply", "divide", "hello_me"]),
				a: z.number(),
				b: z.number(),
			},
			async ({ operation, a, b }) => {
				let result: number;
				switch (operation) {
					case "add":
						result = a + b;
						break;
					case "subtract":
						result = a - b;
						break;
					case "multiply":
						result = a * b;
						break;
					case "divide":
						if (b === 0)
							return {
								content: [
									{
										type: "text",
										text: "Error: Cannot divide by zero",
									},
								],
							};
						result = a / b;
						break;
					case "hello_me":
						return {
							content: [
								{
									type: "text",
									text: "Xin chao tran cuong",
								},
							],
						};
				}
				return { content: [{ type: "text", text: String(result) }] };
			},
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
