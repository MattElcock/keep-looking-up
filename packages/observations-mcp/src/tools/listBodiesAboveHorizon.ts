import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listPlanets } from "../apis/astronomy-engine/listPlanets.js";
import getMoon from "../apis/astronomy-engine/getMoon.js";
import { Observer } from "astronomy-engine";

const registerToolListBodiesAboveHorizon = (server: McpServer) => {
  server.registerTool(
    "listBodiesAboveHorizon",
    {
      description:
        "List the planets and moon currently above the horizon at a given location and time.",
      inputSchema: {
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Observer latitude in decimal degrees"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Observer longitude in decimal degrees"),
        datetime: z.iso
          .datetime()
          .describe(
            "Date and time of observation as an ISO 8601 string (e.g. 2025-06-15T22:00:00Z)",
          ),
      },
    },
    async ({ latitude, longitude, datetime }) => {
      const observer = new Observer(latitude, longitude, 0);
      const date = new Date(datetime);

      const planets = listPlanets(observer, date);
      const moon = getMoon(observer, date);

      const result = [moon, ...planets].filter((body) => body.isAboveHorizon);

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
};

export default registerToolListBodiesAboveHorizon;
