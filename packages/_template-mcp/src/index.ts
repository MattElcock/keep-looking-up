import 'dotenv/config'
import { clerkClient, clerkMiddleware } from '@clerk/express'
import {
  mcpAuthClerk,
  protectedResourceHandlerClerk,
} from '@clerk/mcp-tools/express'
import { fetchClerkAuthorizationServerMetadata } from '@clerk/mcp-tools/server'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import cors from 'cors'
import express from 'express'

const app = express()

// Required for public MCP clients to read the WWW-Authenticate header
app.use(cors({ exposedHeaders: ['WWW-Authenticate'] }))
app.use(clerkMiddleware())
app.use(express.json())

// ------------------------------------------------------------------
// MCP server
// ------------------------------------------------------------------

// A new McpServer instance is required per request — the SDK does not support
// reconnecting a single instance to multiple transports.
function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'template-mcp', // TODO: rename this
    version: '0.1.0',
  })

  // Demo tool — replace with your own tools
  server.registerTool(
    'get_clerk_user_data',
    {
      description: 'Gets data about the Clerk user that authorized this request',
      inputSchema: {},
    },
    async (_, { authInfo }) => {
      // Clerk sets userId directly on authInfo (not nested under extra)
      const userId = (authInfo as unknown as Record<string, unknown>).userId as string
      const userData = await clerkClient.users.getUser(userId)

      return {
        content: [{ type: 'text', text: JSON.stringify(userData) }],
      }
    },
  )

  return server
}

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------

// MCP endpoint — protected by Clerk OAuth token verification
// A fresh server + transport is created per request (SDK does not support reuse)
app.post('/mcp', mcpAuthClerk, async (req, res) => {
  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

// OAuth protected resource metadata (required by current MCP spec)
app.get('/.well-known/oauth-protected-resource/mcp', protectedResourceHandlerClerk)

// OAuth authorization server metadata (required by older MCP spec clients)
app.get('/.well-known/oauth-authorization-server', async (req, res) => {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY
  if (!publishableKey) {
    res.status(500).json({ error: 'CLERK_PUBLISHABLE_KEY is not configured' })
    return
  }
  try {
    const metadata = await fetchClerkAuthorizationServerMetadata({ publishableKey })
    res.json(metadata)
  } catch (err) {
    console.error('Failed to fetch authorization server metadata:', err)
    res.status(500).json({ error: 'Failed to fetch authorization server metadata' })
  }
})

// ------------------------------------------------------------------
// Start
// ------------------------------------------------------------------

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`)
  console.log(`MCP endpoint:  POST http://localhost:${PORT}/mcp`)
})
