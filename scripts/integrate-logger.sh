#!/bin/bash

# index.tsにロガーを統合するスクリプト

FILE="/c/dev/requirements-mcp-server/src/index.ts"

# 1. loggerプロパティを追加 (クラスプロパティ部分)
sed -i '/private viewExporter: ViewExporter;/a\  private logger: OperationLogger;' "$FILE"

# 2. constructorでloggerを初期化
sed -i '/this.viewExporter = new ViewExporter(this.storage);/a\    this.logger = new OperationLogger('"'"'./data'"'"');' "$FILE"

# 3. initialize関数でloggerを初期化
sed -i '/await this.storage.initialize();/a\    await this.logger.initialize();' "$FILE"

echo "✓ Logger integration complete"
