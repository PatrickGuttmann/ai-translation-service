import { timingSafeEqual } from "node:crypto";

import { type FastifyReply, type FastifyRequest } from "fastify";

import { unauthorizedErrorResponse } from "../errors.js";

function tokensMatch(receivedToken: string, expectedToken: string): boolean {
  const receivedBuffer = Buffer.from(receivedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function requireApiKey(expectedApiKey: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authorization = request.headers.authorization;
    const [scheme, token, extra] = authorization?.split(" ") ?? [];

    if (scheme !== "Bearer" || token === undefined || extra !== undefined) {
      await reply.status(401).send(unauthorizedErrorResponse);
      return;
    }

    if (!tokensMatch(token, expectedApiKey)) {
      await reply.status(401).send(unauthorizedErrorResponse);
    }
  };
}
