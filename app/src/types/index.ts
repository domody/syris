export interface ChatResponse {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessagesReponse {
  id?: number;
  role: "user" | "system" | "assistant"
  content: string;
  thinking?: string;
  created_at?: string;
}

export interface VectorMemoryResponse {
    id: number,
    embedding: number[],
    text: string,
    created_at: number
}