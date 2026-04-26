import listAsteroids from "../apis/nasa-neo/feed.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const registerToolListAsteroidsCloseToEarth = (server: McpServer) => {
  server.registerTool(
    "listAsteroidsCloseToEarth",
    {
      description:
        "List asteroids making close approaches to Earth between two dates.",
      inputSchema: {
        start_date: z.iso.date().describe("Start of date range (YYYY-MM-DD)"),
        end_date: z.iso.date().describe("End of date range (YYYY-MM-DD)"),
      },
    },
    async ({ start_date, end_date }) => {
      const response = await listAsteroids(start_date, end_date);

      return {
        content: [{ type: "text", text: JSON.stringify(response) }],
      };
    },
  );
};

export default registerToolListAsteroidsCloseToEarth;
