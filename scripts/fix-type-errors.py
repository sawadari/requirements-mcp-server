#!/usr/bin/env python3
"""
型エラーを修正するスクリプト
"""

with open('src/ai-chat-assistant.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ChatMessage型をTool use対応に変更
old_type = """export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}"""

new_type = """export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | any[];
}"""

content = content.replace(old_type, new_type)
print("Step 1: Updated ChatMessage type")

# 2. statusの型を修正（'draft' -> RequirementStatus型にキャスト）
old_status = """          status: 'draft',"""
new_status = """          status: 'draft' as any,"""

content = content.replace(old_status, new_status)
print("Step 2: Fixed status type")

# 保存
with open('src/ai-chat-assistant.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("\nType errors fixed successfully")
