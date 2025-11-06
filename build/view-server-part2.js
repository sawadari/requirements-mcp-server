"use strict";
// ツリービューAPIエンドポイント
app.get('/api/tree', async (req, res) => {
    try {
        await storage.initialize();
        const requirements = await storage.getAllRequirements();
        // 全ての要求を完全にフラットに返す
        // 重複を排除するために、IDでユニークにする
        const uniqueRequirements = Array.from(new Map(requirements.map(req => [req.id, req])).values());
        const flatTree = uniqueRequirements.map(req => ({
            requirement: req,
            children: [],
            level: 0,
            indent: 0
        }));
        res.json({
            tree: flatTree,
            count: flatTree.length,
        });
    }
    catch (error) {
        res.json({
            error: error.message,
            tree: [],
            count: 0,
        });
    }
});
// ビュー設定を取得するAPIエンドポイント
app.get('/api/view-config', async (req, res) => {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const configPath = path.join(process.cwd(), 'view-config.json');
        try {
            const configData = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configData);
            res.json(config);
        }
        catch (error) {
            // ファイルが存在しない場合はデフォルト設定を返す
            res.json({
                views: [
                    { id: 'list', name: 'リスト', type: 'list' },
                    { id: 'matrix-stakeholder-system', name: 'マトリックス: ステークホルダ→システム', type: 'matrix' },
                    { id: 'matrix-system-functional', name: 'マトリックス: システム→機能', type: 'matrix' }
                ]
            });
        }
    }
    catch (error) {
        res.json({
            error: error.message,
            views: [
                { id: 'list', name: 'リスト', type: 'list' }
            ]
        });
    }
});
// 要求の上位・下位関係を取得するAPIエンドポイント
app.get('/api/requirement/:id/relations', async (req, res) => {
    try {
        await storage.initialize();
        const { id } = req.params;
        const requirement = await storage.getRequirement(id);
        if (!requirement) {
            res.json({ error: '要求が見つかりません', parents: [], children: [] });
            return;
        }
        const allRequirements = await storage.getAllRequirements();
        // 上位要求を取得（この要求がdependencies/refinesに含むもの、またはparentIdで指定されているもの）
        const parents = allRequirements.filter(r => requirement.dependencies.includes(r.id) ||
            (requirement.refines && requirement.refines.includes(r.id)) ||
            requirement.parentId === r.id);
        // 下位要求を取得（この要求をdependencies/refinesに含む、またはparentIdとして指定しているもの）
        const children = allRequirements.filter(r => r.dependencies.includes(id) ||
            (r.refines && r.refines.includes(id)) ||
            r.parentId === id);
        res.json({
            parents: parents.map(r => ({
                id: r.id,
                title: r.title,
                type: r.type,
                category: r.category,
                status: r.status,
                priority: r.priority
            })),
            children: children.map(r => ({
                id: r.id,
                title: r.title,
                type: r.type,
                category: r.category,
                status: r.status,
                priority: r.priority
            }))
        });
    }
    catch (error) {
        res.json({ error: error.message, parents: [], children: [] });
    }
});
// サーバー起動
// 操作ログAPIエンドポイント
app.get('/api/operation-logs-data', async (req, res) => {
    try {
        const logger = new OperationLogger('./data');
        await logger.initialize();
        const logs = logger.getAllLogs();
        const stats = logger.getStatistics();
        res.json({ logs, stats });
    }
    catch (error) {
        res.json({ error: error.message, logs: [], stats: {} });
    }
});
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🌐 要求管理ビューアーを起動しました`);
    console.log(`========================================`);
    console.log(`\n📍 アクセスURL: http://localhost:${PORT}`);
    console.log(`\n✨ 機能:`);
    console.log(`   - ${VIEWS.length}種類のビューをブラウザで表示`);
    console.log(`   - ファイル変更時の自動リフレッシュ`);
    console.log(`   - モダンなダークテーマUI\n`);
    console.log(`終了するには Ctrl+C を押してください\n`);
});
