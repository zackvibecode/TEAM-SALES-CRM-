import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";
import { mcpResourceUrl, oauthIssuer } from "@/lib/mcp/oauth";

const handler = protectedResourceHandler({
  authServerUrls: [oauthIssuer()],
  resourceUrl: mcpResourceUrl(),
});

const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
