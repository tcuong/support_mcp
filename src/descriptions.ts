export const toolDescriptions = {
	browse: {
		description: `Browse and fetch content from a URL using the Zensho API. Supports Jira issues, Backlog URLs/keys, and Teams messages. Can limit the number of comments with maxCommentNum parameter (default: 10).

Response format (200):
{
  "title": "Title of the issue/ticket or message",
  "content": "Main extracted content",
  "reference_links": "Extracted reference links within content",
  "comments": "Comments from related users (number depends on maxCommentNum)",
  "parentContent": "Parent content (for Teams thread starter)",
  "teamsUrl": "URL of Teams message if available (only when type is teams or when issue has link to Teams)",
  "attachedFileIds": ["file-id-1", "file-id-2"],
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
- 500: Server error`,
		params: {
			url: "The URL or key to browse. Supports: Jira issue URL/key (e.g., ZEN2025-2651), Backlog URL/key, Teams message URL",
			oneCommentOnly: "If response data is too large (ResponseTooLargeError), set to true to fetch less data. Default: false"
		}
	},

	listBacklogHandlingTickets: {
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
- 500: Server error`,
		params: {
			appNo: "The app type to list backlog handling tickets for. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)"
		}
	},

	replyBacklogTicket: {
		description: `Reply to an existing backlog ticket with a comment. Requires the ticket URL/key and content.

Response format (200):
{
  "message": "Comment posted successfully",
  "commentUrl": "URL of the comment after posting",
  "imageUrl": "URL of the screenshot image of the screen after commenting"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`,
		params: {
			url: "The backlog ticket URL or key to reply to (e.g., DEV_005_SPO-7012)",
			content: "The content of the comment to post",
			shouldAssign: "Whether to assign the issue to the first person mentioned in the comment. If the ticket is still within your responsibility scope, set to false; otherwise set to true.",
			attachedFileIds: "Optional list of uploaded file IDs (images or other attachments) to attach to the reply"
		}
	},

	createBacklogTicket: {
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
- 500: Server error`,
		params: {
			title: "The title of the backlog issue",
			description: "The detailed description of the backlog issue",
			appNo: "The app type for the backlog issue. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)",
			attachedFileIds: "Optional list of uploaded file IDs (images or other attachments) to attach when creating the issue"
		}
	},

	createJiraTicket: {
		description: `Create a new Jira ticket with a title, description, and type (N, KN, SK, ZET, DMINI). Case-insensitive.

Response format (200):
{
  "message": "Issue created successfully",
  "issueUrl": "https://pm.gem-corp.tech/browse/ZEN2025-1234"
}

Error responses:
- 400: Invalid request
- 500: Server error`,
		params: {
			title: "The title of the Jira issue",
			description: "The detailed description of the Jira issue",
			type: "The app type for the Jira issue. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)"
		}
	},

	replyJiraTicket: {
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
- 500: Server error`,
		params: {
			url: "The Jira ticket URL or key to reply to (e.g., https://pm.gem-corp.tech/browse/ZEN2025-1197 or ZEN2025-1197)",
			content: "The content of the comment to post",
			attachedFileIds: "Optional list of uploaded file IDs (images or other attachments) to attach to the reply"
		}
	},

	search: {
		description: `Search for tickets on Backlog based on text query and app type (N, KN, SK, ZET, DMINI). Returns list of matching tickets.

Response format (200):
[
  {
    "key": "DEV_ZET_APP-266",
    "title": "[ZET]App Ver1.1.1 Release (IOS, AOS)"
  },
  {
    "key": "DEV_ZET_APP-265",
    "title": "[ZET]Bug fix for login feature"
  }
]

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`,
		params: {
			query: "The search query to find tickets (e.g., version number like 1.1.1, keywords like 'bug fix')",
			appNo: "The app type to search tickets for. Allowed values: N, KN, SK, ZET, DMINI (case-insensitive)"
		}
	},

	readFirstUnreadNotification: {
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
- 500: Server error`,
		params: {}
	},

	readAllNotifications: {
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
- 500: Server error`,
		params: {}
	},

	replyInTeams: {
		description: `Reply to a message in Microsoft Teams thread. Requires either url or mentionNo (at least one).

Response format (200):
{
  "message": "Reply sent successfully",
  "url": "https://teams.microsoft.com/l/message/...",
  "text": "Reply content"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`,
		params: {
			text: "The content of the message to reply in Teams",
			url: "URL of the Teams message thread to reply to (required if mentionNo is not provided)",
			mentionNo: "Mention number of the Teams message in mention list (required if url is not provided)"
		}
	},

	readMentions: {
		description: `Read all mentions from Microsoft Teams Activity tab.

Response format (200):
Array of all mentions (ReadAllMentionsResponse):
[
  {
    "mentionNo": 1,
    "id": "activity-feed-item-1",
    "author": null,
    "timestamp": null,
    "content": "Release notification",
    "images": null
  },
  {
    "mentionNo": 2,
    "id": "activity-feed-item-2",
    "author": null,
    "timestamp": null,
    "content": "Bug fix notification",
    "images": null
  }
]

Error responses:
- 400: Invalid request
- 500: Server error`,
		params: {}
	},

	readMessageFromMention: {
		description: `Read a specific mention by its number or ID from Microsoft Teams Activity tab. Opens Activity tab, selects mention by mentionNo or mentionId and returns detailed content. At least one of mentionNo or mentionId must be provided.

Response format (200):
{
  "title": "Message title",
  "content": "Extracted message content...",
  "reference_links": "Reference links...",
  "comments": "Comments content...",
  "parentContent": "Parent content (thread starter message)...",
  "teamsUrl": "https://teams.microsoft.com/l/message/..."
}

Error responses:
- 400: Invalid request (missing or wrong mentionNo/mentionId)
- 500: Server error`,
		params: {
			mentionNo: "The mention number to read (1: first mention, 2: second mention, etc.). Required if mentionId is not provided.",
			mentionId: "The ID of the mention to read. Required if mentionNo is not provided."
		}
	},

	readThreads: {
		description: `Read list of threads from a Microsoft Teams channel. Automatically scrolls up to load at least 10 threads if initially fewer than 10.

Response format (200):
[
  {
    "threadId": "123456",
    "author": "John Doe",
    "timestamp": "10:30 AM",
    "subject": "Thread subject",
    "content": "Thread content",
    "latest_replyies": [
      {
        "replyId": "789012",
        "replyAuthor": "Jane Doe",
        "replyTimestamp": "10:35 AM",
        "replyContent": "Reply content"
      }
    ]
  }
]

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`,
		params: {
			channelName: "The Teams channel name to read threads from. Allowed values: KN, SK, ZET, N, DMINI, GENERAL"
		}
	},

	createThread: {
		description: `Create a new thread/post in a Microsoft Teams channel with specified title and content.

Response format (200):
{
  "message": "Successfully created post in Teams channel",
  "title": "Thread title",
  "content": "Thread content"
}

Error responses:
- 400: Invalid request (missing or wrong parameters)
- 500: Server error`,
		params: {
			title: "The title of the thread/post",
			content: "The content of the thread/post",
			channelName: "The Teams channel name to create thread in. Allowed values: KN, SK, ZET, N, DMINI, GENERAL"
		}
	},

	findThread: {
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
- 500: Server error`,
		params: {
			ticketKey: "Ticket key or URL (e.g., ZEN2025-1234, DEV_005_SPO-7012, or full URL of Jira/Backlog issue)",
			appNo: "App type (SK, KN, N, DMINI, ZET). If thread is not found and appNo is provided, returns 5 most recent threads from appNo channel and 5 from GENERAL channel."
		}
	},

	listJiraHandlingTickets: {
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
- 500: Server error`,
		params: {
			url: "Jira project versions page URL (e.g., https://pm.gem-corp.tech/projects/ZEN2025/versions)",
			appNo: "App type to filter versions by (e.g., ZET, KN, SK, Mini)"
		}
	},

	getScreenShot: {
		description: `Take a screenshot of the current web page opened by Selenium and return the image URL.

Response format (200):
{
  "message": "Screenshot taken",
  "imageUrl": "https://res.cloudinary.com/.../screenshot.png"
}

Error responses:
- 400: Bad request
- 500: Server error`,
		params: {}
	},

	fixCode: {
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
- 500: Server error`,
		params: {
			apiName: "Name of the API endpoint to fix (e.g., replyIssueAction). Optional, defaults to empty string",
			extraInfo: "Additional information to pass to the batch file. Optional, defaults to empty string"
		}
	},

	registerLessonLearned: {
		description: `Register a lesson learned to Google Sheets to avoid similar issues in the future. Records the context, bad practice, reason why it's bad, good practice, the lesson learned, and optional scope.

Response format (200):
{
  "success": true,
  "message": "Lesson learned has been recorded successfully"
}

Error responses:
- 400: Invalid request (missing parameters)
- 500: Server error`,
		params: {
			context: "Context/situation where the lesson was learned (e.g., 'Handling async operations in Playwright')",
			bad: "Bad practice that was used (e.g., 'Using .last(10) method that does not exist')",
			why: "Why that approach was bad (e.g., 'Playwright does not have .last() method for locators')",
			good: "Good practice to follow instead (e.g., 'Use .nth() with loop to get the last items')",
			lessionLearn: "The lesson learned to remember (e.g., 'Always check Playwright API documentation before using new methods')",
			scope: "Scope of the lesson (vn, jp). Optional"
		}
	},

	analyzeFile: {
		description: `Analyze an uploaded file using AI and return a description or analysis based on the provided prompt.

Response format (200):
{
  "fileId": "screenshot.png",
  "analysis": "The image shows a login form with username and password fields...",
  "error": null
}

Error responses:
- 400: Bad request (missing fileId or unsupported format)
- 500: Server error`,
		params: {
			fileId: "ID of the image/file to analyze (filename in the images folder)",
			prompt: "Prompt to guide AI analysis of the image. Default: 'Analyze this image and describe what you see.'"
		}
	},

	readMentionsSlack: {
		description: `Read all mentions from Slack Activity tab and return list of mentions with id and content.

Response format (200):
[
  {
    "id": "at_user-C09KXQUDRJ8-1766471371.007199",
    "text": "Thông báo về việc release version mới"
  },
  {
    "id": "at_channel-C09KXQUDRJ8-1766471400.008000",
    "text": "Thông báo về cuộc họp ngày mai"
  }
]

Error responses:
- 500: Server error`,
		params: {
			isSystem: "Use system browser (default: false)",
			registerTodo: "Register mentions to todo list (default: false)"
		}
	},

	readMentionByMentionId: {
		description: `Read detailed content of a specific mention by ID from Slack. Clicks on the specific mention by ID and reads full message content from channel/thread view.

Response format (200):
{
  "mentionId": "at_user-C09KXQUDRJ8-1766471371.007199",
  "threadUrl": "https://net-jvb.slack.com/messages/C09KXQUDRJ8/p1766471371007199",
  "targetMessage": {
    "messageId": "msg-1766471371.007199",
    "sender": "Nguyễn Văn A",
    "timestamp": "10:30 AM",
    "content": "Nội dung message được mention",
    "files": [],
    "isTarget": true
  },
  "messages": [
    {
      "messageId": "msg-1766471371.007199",
      "sender": "Nguyễn Văn A",
      "timestamp": "10:30 AM",
      "content": "Nội dung message được mention",
      "files": [],
      "isTarget": true
    }
  ]
}

Error responses:
- 400: Invalid request (missing mentionId)
- 500: Server error`,
		params: {
			mentionId: "ID of the mention to read (format: at_user-{channelId}-{timestamp})",
			isSystem: "Use system browser (default: false)"
		}
	},

	replyMessageSlack: {
		description: `Reply to a message in a Slack thread with specified content. Supports @mention users.

Response format (200):
{
  "success": true,
  "message": "Message sent successfully",
  "threadUrl": "https://net-jvb.slack.com/messages/C09KXQUDRJ8/p1766471371007199"
}

Error responses:
- 400: Invalid request (missing threadUrl or content)
- 500: Server error`,
		params: {
			threadUrl: "URL of the Slack thread to reply to",
			content: "Content of the message to send (supports @mention)",
			isSystem: "Use system browser (default: false)"
		}
	}
} as const;

export type ToolName = keyof typeof toolDescriptions;
