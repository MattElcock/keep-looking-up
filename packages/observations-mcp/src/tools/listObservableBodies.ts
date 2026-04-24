import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { listObservableBodies } from '../apis/astronomy-engine/listObservableBodies.js'

const registerListObservableBodesTool = (server: McpServer) => {
  server.registerTool(
    'listObservableBodies',
    {
      description: 'List the planets and moon currently above the horizon at a given location and time. Assumes perfect weather. Limited to planets and the moon — does not include stars or deep-sky objects.',
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe('Observer latitude in decimal degrees'),
        longitude: z.number().min(-180).max(180).describe('Observer longitude in decimal degrees'),
        datetime: z.iso.datetime().describe('Date and time of observation as an ISO 8601 string (e.g. 2025-06-15T22:00:00Z)'),
      },
    },
    async ({ latitude, longitude, datetime }) => {
      const result = listObservableBodies(latitude, longitude, datetime);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    },
  )
}

export default registerListObservableBodesTool
