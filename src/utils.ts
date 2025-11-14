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


export { makeApiCall };