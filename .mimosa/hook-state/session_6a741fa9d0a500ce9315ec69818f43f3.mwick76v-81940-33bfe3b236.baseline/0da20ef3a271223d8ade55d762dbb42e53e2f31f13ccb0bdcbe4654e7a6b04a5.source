/**
 * file: ai-stream-parser.ts
 * description: AI 流式响应解析工具
 * source: @yyc3/zero-deps (adapted)
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-06-03
 * status: active
 */

/**
 * 流式块 / Stream Chunk
 */
export interface StreamChunk {
  /** 内容 / Content */
  content: string;
  /** 是否结束 / Is done */
  done: boolean;
}

/**
 * 创建 AI 流式解析器 / Create AI stream parser
 *
 * @returns {function} 流式解析器 / Stream parser
 *
 * @example
 * ```ts
 * const parseStream = createAIStreamParser();
 * for await (const chunk of parseStream(response)) {
 *   console.log(chunk.content);
 *   if (chunk.done) break;
 * }
 * ```
 */
export function createAIStreamParser() {
  return async function* (response: Response): AsyncGenerator<StreamChunk> {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        yield { content: '', done: true };
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = (buffer + chunk).split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // 忽略解析错误 / Ignore parse errors
          }
        }
      }
    }
  };
}