const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'ai-chat-assistant.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. システムプロンプトの「できないこと」セクションを更新
const oldCannotDo = `## できないこと
- 要求の追加・更新・削除（これらはツリービューから操作可能と案内）
- システム外部の情報取得
- コード生成や実装の詳細`;

const newCannotDo = `## できること（ツール使用）
- **要求の追加**: ユーザーが要求を追加したい場合、add_requirement ツールを使用して直接追加可能
- 要求IDは自動採番されます（最新のID + 1）

## できないこと
- 要求の更新・削除（これらは今後実装予定）
- システム外部の情報取得
- コード生成や実装の詳細`;

content = content.replace(oldCannotDo, newCannotDo);

// 2. Claude API呼び出し部分にtoolsを追加
const oldApiCall = `      // Claude APIを呼び出し
      const response = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          ...this.context.conversationHistory.slice(-10), // 最新10件の履歴
          {
            role: 'user',
            content: \`\${additionalContext}\\n\\n\${userMessage}\`,
          },
        ],
      });`;

const newApiCall = `      // Claude APIを呼び出し（Tool Use対応）
      const response = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2048,
        system: systemPrompt,
        tools: [
          {
            name: 'add_requirement',
            description: 'Add a new requirement to the system. Use this when user asks to add a requirement.',
            input_schema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['stakeholder', 'system', 'functional'],
                  description: 'Type of requirement: stakeholder, system, or functional'
                },
                title: {
                  type: 'string',
                  description: 'Title of the requirement'
                },
                description: {
                  type: 'string',
                  description: 'Detailed description of the requirement'
                },
                priority: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Priority level'
                },
                category: {
                  type: 'string',
                  description: 'Category (e.g., "メンテナンス", "安全性")'
                },
                rationale: {
                  type: 'string',
                  description: 'Rationale for this requirement'
                }
              },
              required: ['type', 'title', 'description', 'priority']
            }
          }
        ],
        messages: [
          ...this.context.conversationHistory.slice(-10), // 最新10件の履歴
          {
            role: 'user',
            content: \`\${additionalContext}\\n\\n\${userMessage}\`,
          },
        ],
      });`;

content = content.replace(oldApiCall, newApiCall);

// 3. Tool useの処理を追加
const oldResponseHandling = `      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // 会話履歴に追加
      this.context.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });`;

const newResponseHandling = `      // Tool useの処理
      let assistantMessage = '';
      const toolResults: any[] = [];

      for (const block of response.content) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        } else if (block.type === 'tool_use') {
          // ツールを実行
          const toolResult = await this.executeTool(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(toolResult)
          });

          // ツール実行結果をメッセージに含める
          if (toolResult.success) {
            assistantMessage += \`\\n\\n✅ **要求を追加しました**\\n- ID: \${toolResult.requirement.id}\\n- タイトル: \${toolResult.requirement.title}\\n- タイプ: \${toolResult.requirement.type}\\n- 優先度: \${toolResult.requirement.priority}\`;
          } else {
            assistantMessage += \`\\n\\n❌ エラー: \${toolResult.error}\`;
          }
        }
      }

      // Tool useがあった場合は追加のAPI呼び出し
      if (toolResults.length > 0) {
        this.context.conversationHistory.push({
          role: 'assistant',
          content: response.content
        });

        this.context.conversationHistory.push({
          role: 'user',
          content: toolResults
        });

        const followUpResponse = await this.anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 1024,
          system: systemPrompt,
          messages: this.context.conversationHistory.slice(-10),
        });

        assistantMessage = followUpResponse.content[0].type === 'text'
          ? followUpResponse.content[0].text
          : assistantMessage;
      }

      // 会話履歴に追加
      this.context.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });`;

content = content.replace(oldResponseHandling, newResponseHandling);

// 4. executeToolメソッドを追加
const insertBeforeClearHistory = `  /**
   * ツールを実行
   */
  private async executeTool(toolName: string, input: any): Promise<any> {
    if (toolName === 'add_requirement') {
      try {
        await this.storage.initialize();
        const allReqs = await this.storage.getAllRequirements();

        // 新しいIDを生成
        const typePrefix = input.type === 'stakeholder' ? 'STK' :
                          input.type === 'system' ? 'SYS' : 'FUNC';
        const existingIds = allReqs
          .filter(r => r.id.startsWith(typePrefix))
          .map(r => parseInt(r.id.split('-')[1]))
          .filter(n => !isNaN(n));
        const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        const newId = \`\${typePrefix}-\${String(nextId).padStart(3, '0')}\`;

        // 新しい要求を作成
        const newRequirement = {
          id: newId,
          type: input.type,
          title: input.title,
          description: input.description,
          priority: input.priority,
          status: 'draft',
          category: input.category || '',
          rationale: input.rationale || '',
          dependencies: [],
          refines: [],
          author: 'AI Chat Assistant',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: []
        };

        // 保存
        await this.storage.addRequirement(newRequirement);

        return {
          success: true,
          requirement: newRequirement
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message
        };
      }
    }

    return {
      success: false,
      error: 'Unknown tool: ' + toolName
    };
  }

  /**
   * 会話履歴をクリア
   */`;

content = content.replace('  /**\n   * 会話履歴をクリア\n   */', insertBeforeClearHistory);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ AI Chat Assistant updated with add_requirement tool');
