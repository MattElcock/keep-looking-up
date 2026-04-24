import getAsteroid from "../apis/nasa-neo/lookup.js";
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'

const registerGetAsteroidTool = (server: McpServer) => {
  server.registerTool(
    "getAsteroid",
    {
      description: "Get detailed information about a specific asteroid, including orbital data and all historical close approaches to planets. Use the asteroid ID from the listAsteroids tool.",
      inputSchema: {
        id: z.string().describe("The asteroid ID, obtained from the listAsteroids tool"),
      },
    },
    async ({id}) => {
      const response = await getAsteroid(id);

      return {
        content: [{type: "text", text: JSON.stringify(response)}]
      }
    },
  )
}

export default registerGetAsteroidTool;
