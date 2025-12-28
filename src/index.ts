import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { toolDescriptions } from "./descriptions";

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

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: this.env.MCP_NAME,
		version: "1.0.0",
	});

	private async makeApiCall(endpoint: string, body: Record<string, any>) {
		try {
			const response = await fetch(`${this.env.API_BASE_URL}${endpoint}`, {
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

	async init() {
		// Browse tool that calls Zensho API
		this.server.tool(
			"browse",
			{
				url: z.string().describe(toolDescriptions.browse.params.url),
				oneCommentOnly: z.boolean().optional().describe(toolDescriptions.browse.params.oneCommentOnly)
			},
			{ description: toolDescriptions.browse.description },
			async ({ url, oneCommentOnly }) => {
				return this.makeApiCall('/api/common/browse', { url, oneCommentOnly: oneCommentOnly ?? false });
			}
		);

		this.addJiraTools();
		this.addBacklogTools();
		this.addSlackTools();
		this.addTeamsTools();

		// Search tool required by ChatGPT
		this.server.tool(
			"search",
			{
				query: z.string().describe(toolDescriptions.search.params.query),
				appNo: z.string()
					.transform(val => val.toUpperCase())
					.describe(toolDescriptions.search.params.appNo)
			},
			{ description: toolDescriptions.search.description },
			async ({ query, appNo }) => {
				return this.makeApiCall('/api/data/search', { text: query, appNo });
			},
		);

		// Take screenshot of current selenium web page
		this.server.tool(
			"getScreenShot",
			{},
			{ description: toolDescriptions.getScreenShot.description },
			async () => {
				return this.makeApiCall('/manage/getScreenShot', {});
			}
		);

		// Fix code using Claude CLI based on error logs
		this.server.tool(
			"fixCode",
			{
				apiName: z.string().optional().describe(toolDescriptions.fixCode.params.apiName),
				extraInfo: z.string().optional().describe(toolDescriptions.fixCode.params.extraInfo)
			},
			{ description: toolDescriptions.fixCode.description },
			async ({ apiName, extraInfo }) => {
				const body: Record<string, unknown> = {};
				if (apiName) body.apiName = apiName;
				if (extraInfo) body.extraInfo = extraInfo;
				return this.makeApiCall('/manage/fixCode', body);
			}
		);

		// Register lesson learned to Google Sheets
		this.server.tool(
			"registerLessonLearned",
			{
				context: z.string().describe(toolDescriptions.registerLessonLearned.params.context),
				bad: z.string().describe(toolDescriptions.registerLessonLearned.params.bad),
				why: z.string().describe(toolDescriptions.registerLessonLearned.params.why),
				good: z.string().describe(toolDescriptions.registerLessonLearned.params.good),
				lessionLearn: z.string().describe(toolDescriptions.registerLessonLearned.params.lessionLearn),
				scope: z.enum(['vn', 'jp']).optional().describe(toolDescriptions.registerLessonLearned.params.scope)
			},
			{ description: toolDescriptions.registerLessonLearned.description },
			async ({ context, bad, why, good, lessionLearn, scope }) => {
				const body: Record<string, unknown> = { context, bad, why, good, lessionLearn };
				if (scope) body.scope = scope;
				return this.makeApiCall('/api/common/lessionLearn', body);
			}
		);

		// Analyze image/file using AI
		this.server.tool(
			"analyzeImage",
			{
				fileId: z.string().describe(toolDescriptions.analyzeImage.params.fileId),
				prompt: z.string().optional().describe(toolDescriptions.analyzeImage.params.prompt)
			},
			{ description: toolDescriptions.analyzeImage.description },
			async ({ fileId, prompt }) => {
				const body: Record<string, unknown> = { fileId };
				if (prompt) body.prompt = prompt;
				return this.makeApiCall('/manage/analyzeImage', body);
			}
		);
	}

	private addJiraTools() {
		if (this.env.DISABLEd_FUNCTIONS.JIRA) return;
		// Create Jira ticket
		this.server.tool(
			"jira:createJiraTicket",
			{
				title: z.string().describe(toolDescriptions.createJiraTicket.params.title),
				description: z.string().describe(toolDescriptions.createJiraTicket.params.description),
				type: z.string()
					.transform(val => val.toUpperCase())
					.describe(toolDescriptions.createJiraTicket.params.type),
			},
			{ description: toolDescriptions.createJiraTicket.description },
			async ({ title, description, type }) => {
				return this.makeApiCall('/api/jira/createIssue', { title, description, type });
			}
		);

		// Reply Jira ticket
		this.server.tool(
			"jira:replyJiraTicket",
			{
				url: z.string().describe(toolDescriptions.replyJiraTicket.params.url),
				content: z.string().describe(toolDescriptions.replyJiraTicket.params.content),
				attachedFileIds: z.array(z.string()).optional().describe(toolDescriptions.replyJiraTicket.params.attachedFileIds),
			},
			{ description: toolDescriptions.replyJiraTicket.description },
			async ({ url, content, attachedFileIds }) => {
				const body: Record<string, unknown> = { url, content };
				if (attachedFileIds) body.attachedFileIds = attachedFileIds;
				return this.makeApiCall('/api/jira/replyIssue', body);
			}
		);
		// List Jira handling tickets by app type
		this.server.tool(
			"jira:listJiraHandlingTickets",
			{
				url: z.string().describe(toolDescriptions.listJiraHandlingTickets.params.url),
				appNo: z.string().describe(toolDescriptions.listJiraHandlingTickets.params.appNo)
			},
			{ description: toolDescriptions.listJiraHandlingTickets.description },
			async ({ url, appNo }) => {
				return this.makeApiCall('/api/jira/listHandlingTickets', { url, appNo });
			}
		);
		
	}

	private addBacklogTools() {
		if (this.env.DISABLEd_FUNCTIONS.BACKLOG) return;

		// List handling ticket by app type
		this.server.tool(
			"backlog:listBacklogHandlingTickets",
			{
				appNo: z.string()
					.transform(val => val.toUpperCase())
					.describe(toolDescriptions.listBacklogHandlingTickets.params.appNo)
			},
			{ description: toolDescriptions.listBacklogHandlingTickets.description },
			async ({ appNo }) => {
				return this.makeApiCall('/api/backlog/listHandlingTickets', { appNo });
			}
		);

		// Reply backlog ticket
		this.server.tool(
			"backlog:replyBacklogTicket",
			{
				url: z.string().describe(toolDescriptions.replyBacklogTicket.params.url),
				content: z.string().describe(toolDescriptions.replyBacklogTicket.params.content),
				shouldAssign: z.boolean().describe(toolDescriptions.replyBacklogTicket.params.shouldAssign),
				attachedFileIds: z.array(z.string()).optional().describe(toolDescriptions.replyBacklogTicket.params.attachedFileIds),
			},
			{ description: toolDescriptions.replyBacklogTicket.description },
			async ({ url, content, shouldAssign, attachedFileIds }) => {
				const body: Record<string, unknown> = { url, content, shouldAssign };
				if (attachedFileIds) body.attachedFileIds = attachedFileIds;
				return this.makeApiCall('/api/backlog/replyIssue', body);
			}
		);

		// Create backlog ticket
		this.server.tool(
			"backlog:createBacklogTicket",
			{
				title: z.string().describe(toolDescriptions.createBacklogTicket.params.title),
				description: z.string().describe(toolDescriptions.createBacklogTicket.params.description),
				appNo: z.string()
					.transform(val => val.toUpperCase())
					.describe(toolDescriptions.createBacklogTicket.params.appNo),
				attachedFileIds: z.array(z.string()).optional().describe(toolDescriptions.createBacklogTicket.params.attachedFileIds),
			},
			{ description: toolDescriptions.createBacklogTicket.description },
			async ({ title, description, appNo, attachedFileIds }) => {
				const body: Record<string, unknown> = { title, description, appNo };
				if (attachedFileIds) body.attachedFileIds = attachedFileIds;
				return this.makeApiCall('/api/backlog/createIssue', body);
			}
		);

		// Read first unread notification from Backlog
		this.server.tool(
			"backlog:readFirstUnreadNotification",
			{},
			{ description: toolDescriptions.readFirstUnreadNotification.description },
			async () => {
				return this.makeApiCall('/api/backlog/readFirstUnreadNotification', {});
			}
		);

		// Read all notifications from Backlog
		this.server.tool(
			"backlog:readAllNotifications",
			{},
			{ description: toolDescriptions.readAllNotifications.description },
			async () => {
				return this.makeApiCall('/api/backlog/readAllNotifications', {});
			}
		);
	}

	private addTeamsTools() {
		if (this.env.DISABLEd_FUNCTIONS.TEAMS) return;

		
		// Reply in Teams
		this.server.tool(
			"teams:replyInTeams",
			{
				text: z.string().describe(toolDescriptions.replyInTeams.params.text),
				url: z.string().optional().describe(toolDescriptions.replyInTeams.params.url),
				mentionNo: z.string().optional().describe(toolDescriptions.replyInTeams.params.mentionNo)
			},
			{ description: toolDescriptions.replyInTeams.description },
			async ({ text, url, mentionNo }) => {
				const body: any = { text };
				if (url) body.url = url;
				if (mentionNo) body.mentionNo = mentionNo;
				return this.makeApiCall('/api/teams/replyInTeams', body);
			}
		);

		// Read mentions from Teams
		this.server.tool(
			"teams:readMentions",
			{},
			{ description: toolDescriptions.readMentions.description },
			async () => {
				return this.makeApiCall('/api/teams/readMentions', {});
			}
		);

		// Read message from mention by number or ID
		this.server.tool(
			"teams:readMessageFromMention",
			{
				mentionNo: z.number().min(1).optional().describe(toolDescriptions.readMessageFromMention.params.mentionNo),
				mentionId: z.string().optional().describe(toolDescriptions.readMessageFromMention.params.mentionId)
			},
			{ description: toolDescriptions.readMessageFromMention.description },
			async ({ mentionNo, mentionId }) => {
				const body: Record<string, unknown> = {};
				if (mentionNo) body.mentionNo = mentionNo;
				if (mentionId) body.mentionId = mentionId;
				return this.makeApiCall('/api/teams/readMessageFromMention', body);
			}
		);

		// Read threads from Teams channel
		this.server.tool(
			"teams:readThreads",
			{
				channelName: z.string().describe(toolDescriptions.readThreads.params.channelName)
			},
			{ description: toolDescriptions.readThreads.description },
			async ({ channelName }) => {
				return this.makeApiCall('/api/teams/readThreads', { channelName });
			}
		);

		// Create thread in Teams channel
		this.server.tool(
			"teams:createThread",
			{
				title: z.string().describe(toolDescriptions.createThread.params.title),
				content: z.string().describe(toolDescriptions.createThread.params.content),
				channelName: z.string().describe(toolDescriptions.createThread.params.channelName)
			},
			{ description: toolDescriptions.createThread.description },
			async ({ title, content, channelName }) => {
				return this.makeApiCall('/api/teams/createThread', { title, content, channelName });
			}
		);

		// Find Teams thread URL from ticket key
		this.server.tool(
			"teams:findThread",
			{
				ticketKey: z.string().describe(toolDescriptions.findThread.params.ticketKey),
				appNo: z.enum(["SK", "KN", "N", "DMINI", "ZET"]).optional().describe(toolDescriptions.findThread.params.appNo)
			},
			{ description: toolDescriptions.findThread.description },
			async ({ ticketKey, appNo }) => {
				return this.makeApiCall('/api/teams/findThread', { ticketKey, appNo });
			}
		);
	}

	private addSlackTools() {
		if (this.env.DISABLEd_FUNCTIONS.SLACK) return;
		// Read mentions from Slack
		this.server.tool(
			"slack:readMentionsSlack",
			{
				isSystem: z.boolean().optional().describe(toolDescriptions.readMentionsSlack.params.isSystem),
				registerTodo: z.boolean().optional().describe(toolDescriptions.readMentionsSlack.params.registerTodo)
			},
			{ description: toolDescriptions.readMentionsSlack.description },
			async ({ isSystem, registerTodo }) => {
				const body: Record<string, unknown> = {};
				if (isSystem !== undefined) body.isSystem = isSystem;
				if (registerTodo !== undefined) body.registerTodo = registerTodo;
				return this.makeApiCall('/api/slack/readMentionsSlack', body);
			}
		);

		// Read mention by mentionId from Slack
		this.server.tool(
			"slack:readMentionByMentionId",
			{
				mentionId: z.string().describe(toolDescriptions.readMentionByMentionId.params.mentionId),
				isSystem: z.boolean().optional().describe(toolDescriptions.readMentionByMentionId.params.isSystem)
			},
			{ description: toolDescriptions.readMentionByMentionId.description },
			async ({ mentionId, isSystem }) => {
				const body: Record<string, unknown> = { mentionId };
				if (isSystem !== undefined) body.isSystem = isSystem;
				return this.makeApiCall('/api/slack/readMentionByMentionId', body);
			}
		);

		// Reply message in Slack thread
		this.server.tool(
			"slack:replyMessageSlack",
			{
				threadUrl: z.string().describe(toolDescriptions.replyMessageSlack.params.threadUrl),
				content: z.string().describe(toolDescriptions.replyMessageSlack.params.content),
				isSystem: z.boolean().optional().describe(toolDescriptions.replyMessageSlack.params.isSystem)
			},
			{ description: toolDescriptions.replyMessageSlack.description },
			async ({ threadUrl, content, isSystem }) => {
				const body: Record<string, unknown> = { threadUrl, content };
				if (isSystem !== undefined) body.isSystem = isSystem;
				return this.makeApiCall('/api/slack/replyMessageSlack', body);
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
