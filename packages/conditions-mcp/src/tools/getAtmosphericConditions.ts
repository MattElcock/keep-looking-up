import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getAtmosphericConditions } from "../apis/7timer/forecast.js";

const registerToolGetAtmosphericConditions = (server: McpServer) => {
  server.registerTool(
    "getAtmosphericConditions",
    {
      description:
        "Check atmospheric conditions (cloud cover, seeing, transparency, precipitation) at a location and time. Call this before fetching observation or asteroid data — if conditions are poor, skip other tools and tell the user. Covers atmospheric factors only; does not include moon phase or sky brightness.",
      inputSchema: {
        latitude: z.number().min(-90).max(90).describe("Decimal degrees, -90 to 90"),
        longitude: z.number().min(-180).max(180).describe("Decimal degrees, -180 to 180"),
        datetime: z.iso.datetime().describe("ISO 8601 datetime"),
        end_datetime: z
          .iso.datetime()
          .optional()
          .describe("ISO 8601 datetime — if provided, returns array of forecasts for the range"),
      },
    },
    async ({ latitude, longitude, datetime, end_datetime }) => {
      const result = await getAtmosphericConditions(latitude, longitude, datetime, end_datetime);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
};

export default registerToolGetAtmosphericConditions;
