/**
 * 修正エンジンの型定義
 * 可逆性・局所化→波及・段階的適用を実現する
 */
/**
 * 要求の配列をレコードに変換
 *
 * @param requirements - 要求の配列
 * @returns 要求のレコード
 */
export function toRequirementRecord(requirements) {
    return Object.fromEntries(requirements.map(r => [r.id, r]));
}
/**
 * 要求のレコードを配列に変換
 *
 * @param record - 要求のレコード
 * @returns 要求の配列
 */
export function fromRequirementRecord(record) {
    return Object.values(record);
}
/**
 * Storage Requirement を Fix Engine Requirement に変換
 */
export function toFixEngineRequirement(req) {
    const fixEngineReq = {
        id: req.id,
        title: req.title,
        description: req.description,
        status: req.status,
        priority: req.priority,
        category: req.category,
    };
    // オプショナルフィールド
    if (req.type)
        fixEngineReq.type = req.type;
    if (req.refines)
        fixEngineReq.refines = req.refines;
    if (req.depends_on)
        fixEngineReq.depends_on = req.depends_on;
    if (req.derived_from)
        fixEngineReq.derived_from = req.derived_from;
    if (req.supersedes)
        fixEngineReq.supersedes = req.supersedes;
    if (req.canonical_of)
        fixEngineReq.canonical_of = req.canonical_of;
    if (req.analysis)
        fixEngineReq.analysis = req.analysis;
    if (req.tags)
        fixEngineReq.tags = req.tags;
    if (req.author)
        fixEngineReq.author = req.author;
    if (req.assignee)
        fixEngineReq.assignee = req.assignee;
    if (req.rationale)
        fixEngineReq.rationale = req.rationale;
    if (req.createdAt)
        fixEngineReq.createdAt = typeof req.createdAt === 'string' ? req.createdAt : req.createdAt.toISOString();
    if (req.updatedAt)
        fixEngineReq.updatedAt = typeof req.updatedAt === 'string' ? req.updatedAt : req.updatedAt.toISOString();
    return fixEngineReq;
}
/**
 * Storage Requirements を Fix Engine Requirements に変換
 */
export function toFixEngineRequirements(reqs) {
    return reqs.map(toFixEngineRequirement);
}
/**
 * Fix Engine Requirement を Storage Requirement に変換
 * （Partial<Requirement>として返す）
 */
export function toStorageRequirement(req) {
    return {
        id: req.id,
        title: req.title,
        description: req.description,
        status: req.status,
        priority: req.priority,
        category: req.category,
        type: req.type,
        refines: req.refines,
        depends_on: req.depends_on,
        derived_from: req.derived_from,
        supersedes: req.supersedes,
        canonical_of: req.canonical_of,
        tags: req.tags || [],
        dependencies: req.depends_on || [],
        author: req.author,
        assignee: req.assignee,
        rationale: req.rationale,
    };
}
