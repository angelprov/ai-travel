import { prisma } from "../db/client.js";
import type { AssistantAttachments, ChatMessage } from "../types.js";

interface MessageRow {
  id: string;
  role: string;
  text: string;
  status: string;
  attachments: string | null;
  createdAt: Date;
}

function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role as ChatMessage["role"],
    text: row.text,
    createdAt: row.createdAt.getTime(),
    status: row.status as ChatMessage["status"],
    attachments: row.attachments ? (JSON.parse(row.attachments) as AssistantAttachments) : undefined,
  };
}

export async function getMessages(tripId: string, limit = 100): Promise<ChatMessage[]> {
  const rows = await prisma.chatMessage.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return rows.map(toMessage);
}

export interface NewMessageInput {
  role: "user" | "assistant";
  text: string;
  status?: "sent" | "error";
  attachments?: AssistantAttachments;
}

export async function appendMessage(userId: string, tripId: string, input: NewMessageInput): Promise<ChatMessage> {
  const row = await prisma.chatMessage.create({
    data: {
      userId,
      tripId,
      role: input.role,
      text: input.text,
      status: input.status ?? "sent",
      attachments: input.attachments ? JSON.stringify(input.attachments) : null,
    },
  });
  return toMessage(row);
}
