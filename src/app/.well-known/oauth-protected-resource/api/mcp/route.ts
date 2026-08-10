import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";
import { mcpResourceUrl, oauthIssuer } from "@/lib/mcp/oauth";

/** Path-aware discovery some MCP clients request for /api/mcp */
const handler = protectedResourceHandler({
  authServerUrls: [oauthIssuer()],
  resourceUrl: mcpResourceUrl(),
});

const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
