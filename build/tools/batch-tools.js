/**
 * Batch Tools for MCP Server
 * 複数要求の一括操作ツール群
 */
import { createLogger } from '../common/logger.js';
const logger = createLogger('BatchTools');
export class BatchTools {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * 複数要求の一括追加
     */
    async batchAddRequirements(requirements) {
        logger.info(`Batch adding ${requirements.length} requirements`);
        await this.storage.initialize();
        const added = [];
        const failed = [];
        for (const reqInput of requirements) {
            try {
                const newId = await this.generateNextId(reqInput.type);
                const newRequirement = {
                    id: newId,
                    type: reqInput.type,
                    title: reqInput.title,
                    description: reqInput.description,
                    priority: reqInput.priority,
                    status: 'draft',
                    category: reqInput.category || '',
                    rationale: reqInput.rationale || '',
                    dependencies: reqInput.dependencies || [],
                    refines: reqInput.refines || [],
                    author: 'AI Chat Assistant',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    tags: reqInput.tags || [],
                };
                await this.storage.addRequirement(newRequirement);
                added.push(newRequirement);
                logger.info(`Added requirement: ${newId}`);
            }
            catch (error) {
                const errorObj = error instanceof Error ? error : new Error(String(error));
                logger.error('Failed to add requirement', errorObj);
                failed.push({
                    input: reqInput,
                    error: errorObj.message,
                });
            }
        }
        return {
            success: failed.length === 0,
            added,
            failed,
        };
    }
    /**
     * 依存関係の一括設定
     */
    async batchSetRelationships(relationships) {
        logger.info(`Batch setting ${relationships.length} relationships`);
        await this.storage.initialize();
        let updated = 0;
        const failed = [];
        for (const rel of relationships) {
            try {
                const child = await this.storage.getRequirement(rel.childId);
                if (!child) {
                    throw new Error(`Child requirement not found: ${rel.childId}`);
                }
                const parent = await this.storage.getRequirement(rel.parentId);
                if (!parent) {
                    throw new Error(`Parent requirement not found: ${rel.parentId}`);
                }
                if (rel.relationshipType === 'refines') {
                    const refines = child.refines || [];
                    if (!refines.includes(rel.parentId)) {
                        refines.push(rel.parentId);
                        await this.storage.updateRequirement(rel.childId, { refines });
                        updated++;
                    }
                }
                else if (rel.relationshipType === 'depends_on') {
                    const dependencies = child.dependencies || [];
                    if (!dependencies.includes(rel.parentId)) {
                        dependencies.push(rel.parentId);
                        await this.storage.updateRequirement(rel.childId, { dependencies });
                        updated++;
                    }
                }
                logger.info(`Set relationship: ${rel.childId} -> ${rel.parentId} (${rel.relationshipType})`);
            }
            catch (error) {
                const errorObj = error instanceof Error ? error : new Error(String(error));
                logger.error('Failed to set relationship', errorObj);
                failed.push({
                    relationship: rel,
                    error: errorObj.message,
                });
            }
        }
        return {
            success: failed.length === 0,
            updated,
            failed,
        };
    }
    /**
     * 次の要求IDを生成
     */
    async generateNextId(type) {
        const allReqs = await this.storage.getAllRequirements();
        const typePrefix = type === 'stakeholder' ? 'STK' :
            type === 'system' ? 'SYS' : 'FUNC';
        const existingIds = allReqs
            .filter(r => r.id.startsWith(typePrefix))
            .map(r => parseInt(r.id.split('-')[1]))
            .filter(n => !isNaN(n));
        const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
        return `${typePrefix}-${String(nextId).padStart(3, '0')}`;
    }
    /**
     * 統計情報を取得
     */
    async getStatistics() {
        logger.info('Getting statistics');
        await this.storage.initialize();
        const allReqs = await this.storage.getAllRequirements();
        const byType = {};
        const byStatus = {};
        const byPriority = {};
        for (const req of allReqs) {
            const typeKey = String(req.type);
            const statusKey = String(req.status);
            const priorityKey = String(req.priority);
            byType[typeKey] = (byType[typeKey] || 0) + 1;
            byStatus[statusKey] = (byStatus[statusKey] || 0) + 1;
            byPriority[priorityKey] = (byPriority[priorityKey] || 0) + 1;
        }
        return {
            total: allReqs.length,
            byType,
            byStatus,
            byPriority,
        };
    }
}
