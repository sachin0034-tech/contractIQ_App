export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionRequest {
  messages: LlmMessage[];
  /** Aborting cancels the upstream request. */
  signal?: AbortSignal;
}

export interface LlmCompletion {
  text: string;
  inputTokens: number;
  outputTokens: number;
  /** "length" when the model stopped because it ran out of output budget, otherwise "stop". */
  finishReason: 'stop' | 'length';
}

/** Provider-neutral interface so the AI provider can change without touching services. */
export interface LlmClient {
  complete(request: LlmCompletionRequest): Promise<LlmCompletion>;
}
