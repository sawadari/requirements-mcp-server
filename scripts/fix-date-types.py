#!/usr/bin/env python3
"""
Date型のエラーを修正
"""

with open('src/ai-chat-assistant.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# createdAt と updatedAt を Date 型に変更
old_dates = """          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),"""

new_dates = """          createdAt: new Date(),
          updatedAt: new Date(),"""

content = content.replace(old_dates, new_dates)
print("Fixed Date types")

with open('src/ai-chat-assistant.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Date type errors fixed")
