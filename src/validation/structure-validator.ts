/**
 * 構造検証エンジン
 * ドメインA（階層ルール）とドメインB（グラフヘルス）の機械的検証を実装
 */

import type {
  Requirement,
  RequirementType,
  ValidationViolation,
  ValidationRule,
  ViolationSeverity,
} from '../types.js';
import type { OntologyManager } from '../ontology/ontology-manager.js';

/**
 * 階層ルール検証（ドメインA）
 */
export class HierarchyValidator {
  private static ontologyManager?: OntologyManager;

  /**
   * オントロジーマネージャーを設定
   */
  static setOntologyManager(manager: OntologyManager) {
    HierarchyValidator.ontologyManager = manager;
  }

  /**
   * A1: レベル間の関係制約チェック（オントロジー対応）
   */
  static validateParentChildTypes(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!req.refines || req.refines.length === 0) {
      return violations;
    }

    // オントロジーマネージャーがある場合はそれを使用
    const allowedPairs = HierarchyValidator.ontologyManager
      ? HierarchyValidator.buildAllowedPairsFromOntology()
      : (rule.parameters?.allowedParentChildPairs || [
          { parent: 'stakeholder', child: 'system' },
          { parent: 'system', child: 'system_functional' },
        ]);

    for (const parentId of req.refines) {
      const parent = allRequirements.get(parentId);
      if (!parent) {
        violations.push({
          id: `${rule.id}-${req.id}-${parentId}`,
          requirementId: req.id,
          ruleDomain: 'hierarchy',
          ruleId: rule.id,
          severity: rule.severity,
          message: `親要求 ${parentId} が存在しません`,
          details: `要求 ${req.id} が参照している親要求が見つかりません`,
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      const isAllowed = allowedPairs.some(
        (pair: any) => pair.parent === parent.type && pair.child === req.type
      );

      if (!isAllowed) {
        violations.push({
          id: `${rule.id}-${req.id}-${parentId}`,
          requirementId: req.id,
          ruleDomain: 'hierarchy',
          ruleId: rule.id,
          severity: rule.severity,
          message: `不正な階層関係: ${parent.type} → ${req.type}`,
          details: `${parent.type}要求は${req.type}要求を子に持つことができません`,
          comparisonTargets: [parentId],
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return violations;
  }

  /**
   * オントロジーから許可ペアを構築
   */
  private static buildAllowedPairsFromOntology(): Array<{ parent: string; child: string }> {
    if (!HierarchyValidator.ontologyManager) {
      return [];
    }

    const pairs: Array<{ parent: string; child: string }> = [];
    const stages = HierarchyValidator.ontologyManager.getAllStages();

    for (const stage of stages) {
      for (const childStageId of stage.childStages) {
        pairs.push({
          parent: stage.id,
          child: childStageId,
        });
      }
    }

    return pairs;
  }

  /**
   * A2: 親要求の存在チェック
   */
  static validateParentExistence(
    req: Requirement,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const requireParent = rule.parameters?.requireParent || ['system', 'system_functional'];

    if (requireParent.includes(req.type) && (!req.refines || req.refines.length === 0)) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'hierarchy',
        ruleId: rule.id,
        severity: rule.severity,
        message: `${req.type}要求には親要求が必要です`,
        details: `refinesフィールドに少なくとも1つの親要求IDを設定してください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * A3: 循環参照の検出（refinesエッジ）
   */
  static detectCycles(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (currentId: string): boolean => {
      if (!visited.has(currentId)) {
        visited.add(currentId);
        recStack.add(currentId);

        const current = allRequirements.get(currentId);
        if (current?.refines) {
          for (const parentId of current.refines) {
            if (!visited.has(parentId) && hasCycle(parentId)) {
              return true;
            } else if (recStack.has(parentId)) {
              return true;
            }
          }
        }
      }
      recStack.delete(currentId);
      return false;
    };

    if (hasCycle(req.id)) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'hierarchy',
        ruleId: rule.id,
        severity: rule.severity,
        message: `循環参照が検出されました`,
        details: `要求 ${req.id} を起点とする循環参照があります`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * A4: 最大階層深度チェック
   */
  static validateMaxDepth(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const maxDepth = rule.parameters?.maxDepth || 3;

    const getDepth = (currentId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(currentId)) return 0; // 循環参照対策
      visited.add(currentId);

      const current = allRequirements.get(currentId);
      if (!current || !current.refines || current.refines.length === 0) {
        return 1;
      }

      const parentDepths = current.refines.map(parentId => getDepth(parentId, new Set(visited)));
      return 1 + Math.max(...parentDepths);
    };

    const depth = getDepth(req.id);
    if (depth > maxDepth) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'hierarchy',
        ruleId: rule.id,
        severity: rule.severity,
        message: `階層深度が上限を超えています（${depth} > ${maxDepth}）`,
        details: `要求の階層を見直して、深度を${maxDepth}以下にしてください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * A5: 子要求の存在チェック（オントロジー対応）
   * ステークホルダ要求とシステム要求は子要求が必要
   */
  static validateChildExistence(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // オントロジーマネージャーから子要求が必要なタイプを取得
    let requireChild: string[];
    let expectedChildTypes: string[] = [];

    console.log(`[A5デバッグ] ${req.id} (${req.type}) の検証開始`);

    if (HierarchyValidator.ontologyManager) {
      const stages = HierarchyValidator.ontologyManager.getAllStages();
      const stage = stages.find(s => s.id === req.type);
      console.log(`[A5デバッグ] stage見つかった: ${!!stage}, requiresChildren: ${stage?.requiresChildren}, childStages: ${stage?.childStages?.length || 0}`);

      // requiresChildren フィールドをチェック（明示的にtrueの場合のみ必須）
      if (stage && stage.requiresChildren === true) {
        if (stage.childStages.length > 0) {
          expectedChildTypes = stage.childStages;
        }
        requireChild = [stage.id];
        console.log(`[A5デバッグ] ${req.type} は子要求が必須と判定`);
      } else {
        requireChild = [];
        console.log(`[A5デバッグ] ${req.type} は子要求が不要と判定`);
      }
    } else {
      // デフォルト: stakeholder と system は子要求が必要
      requireChild = rule.parameters?.requireChild || ['stakeholder', 'system'];
      console.log(`[A5デバッグ] オントロジーなし、デフォルトルール適用: ${requireChild}`);
    }

    const reqType = req.type as string;
    console.log(`[A5デバッグ] requireChild.includes(${reqType}): ${requireChild.includes(reqType)}`);

    if (requireChild.includes(reqType)) {
      // 子要求があるかチェック（このreqを親として参照している要求を探す）
      const hasChildren = Array.from(allRequirements.values()).some(
        (otherReq) => otherReq.refines && otherReq.refines.includes(req.id)
      );

      if (!hasChildren) {

        violations.push({
          id: `${rule.id}-${req.id}`,
          requirementId: req.id,
          ruleDomain: 'hierarchy',
          ruleId: rule.id,
          severity: rule.severity,
          message: `${req.type}要求には子要求が必要です`,
          details: expectedChildTypes.length > 0
            ? `この要求を詳細化する${expectedChildTypes.join('または')}要求を追加してください`
            : `この要求を詳細化する下位要求を追加してください`,
          suggestedFix: expectedChildTypes.length > 0
            ? `${expectedChildTypes[0]}要求を作成し、refinesフィールドで「${req.id}」を参照させてください`
            : undefined,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return violations;
  }
}

/**
 * グラフヘルス検証（ドメインB）
 */
export class GraphHealthValidator {
  /**
   * B1: DAG検証（depends_on + refinesエッジ）
   */
  static validateDAG(
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (currentId: string): boolean => {
      if (!visited.has(currentId)) {
        visited.add(currentId);
        recStack.add(currentId);

        const current = allRequirements.get(currentId);
        const edges = [
          ...(current?.refines || []),
          ...(current?.depends_on || []),
        ];

        for (const targetId of edges) {
          if (!visited.has(targetId) && hasCycle(targetId)) {
            return true;
          } else if (recStack.has(targetId)) {
            return true;
          }
        }
      }
      recStack.delete(currentId);
      return false;
    };

    for (const [reqId, req] of allRequirements) {
      visited.clear();
      recStack.clear();
      if (hasCycle(reqId)) {
        violations.push({
          id: `${rule.id}-${reqId}`,
          requirementId: reqId,
          ruleDomain: 'graph_health',
          ruleId: rule.id,
          severity: rule.severity,
          message: `グラフに循環が存在します`,
          details: `要求 ${reqId} を含む循環が検出されました（refines + depends_onエッジ）`,
          detectedAt: new Date().toISOString(),
        });
        break; // 1つ見つかれば十分
      }
    }

    return violations;
  }

  /**
   * B2: ファンアウト制限（子要求数の上限）
   */
  static validateFanOut(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const maxChildren = rule.parameters?.maxChildren || 10;

    // この要求を親（refines）とする子要求を数える
    const children = Array.from(allRequirements.values()).filter(
      r => r.refines?.includes(req.id)
    );

    if (children.length > maxChildren) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'graph_health',
        ruleId: rule.id,
        severity: rule.severity,
        message: `子要求数が上限を超えています（${children.length} > ${maxChildren}）`,
        details: `子要求を${maxChildren}個以下にまとめるか、中間階層を追加してください`,
        comparisonTargets: children.map(c => c.id),
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * B3: 孤立要求の検出
   */
  static detectOrphans(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    const hasIncoming = Array.from(allRequirements.values()).some(
      r => r.refines?.includes(req.id) ||
           r.depends_on?.includes(req.id) ||
           r.conflicts_with?.includes(req.id) ||
           r.duplicates?.includes(req.id)
    );

    const hasOutgoing =
      (req.refines && req.refines.length > 0) ||
      (req.depends_on && req.depends_on.length > 0) ||
      (req.conflicts_with && req.conflicts_with.length > 0) ||
      (req.duplicates && req.duplicates.length > 0);

    if (!hasIncoming && !hasOutgoing) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'graph_health',
        ruleId: rule.id,
        severity: rule.severity,
        message: `孤立要求が検出されました`,
        details: `要求 ${req.id} は他の要求と関係を持っていません`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * B4: 競合関係の双方向対称性チェック
   */
  static validateConflictSymmetry(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!req.conflicts_with) return violations;

    for (const conflictId of req.conflicts_with) {
      const conflict = allRequirements.get(conflictId);
      if (!conflict) {
        violations.push({
          id: `${rule.id}-${req.id}-${conflictId}`,
          requirementId: req.id,
          ruleDomain: 'graph_health',
          ruleId: rule.id,
          severity: rule.severity,
          message: `競合要求 ${conflictId} が存在しません`,
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      if (!conflict.conflicts_with?.includes(req.id)) {
        violations.push({
          id: `${rule.id}-${req.id}-${conflictId}`,
          requirementId: req.id,
          ruleDomain: 'graph_health',
          ruleId: rule.id,
          severity: rule.severity,
          message: `競合関係が双方向ではありません`,
          details: `要求 ${req.id} は ${conflictId} と競合していますが、逆方向の関係がありません`,
          comparisonTargets: [conflictId],
          suggestedFix: `要求 ${conflictId} のconflicts_withに ${req.id} を追加してください`,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return violations;
  }

  /**
   * B5: 重複候補の妥当性（同じレベルかチェック）
   */
  static validateDuplicateCandidates(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!req.duplicates) return violations;

    for (const dupId of req.duplicates) {
      const dup = allRequirements.get(dupId);
      if (!dup) {
        violations.push({
          id: `${rule.id}-${req.id}-${dupId}`,
          requirementId: req.id,
          ruleDomain: 'graph_health',
          ruleId: rule.id,
          severity: rule.severity,
          message: `重複候補要求 ${dupId} が存在しません`,
          detectedAt: new Date().toISOString(),
        });
        continue;
      }

      if (dup.type !== req.type) {
        violations.push({
          id: `${rule.id}-${req.id}-${dupId}`,
          requirementId: req.id,
          ruleDomain: 'graph_health',
          ruleId: rule.id,
          severity: rule.severity,
          message: `重複候補のレベルが異なります`,
          details: `要求 ${req.id} (${req.type}) と ${dupId} (${dup.type}) は異なるレベルです`,
          comparisonTargets: [dupId],
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return violations;
  }
}

/**
 * 構造検証エンジンのメインクラス
 */
export class StructureValidationEngine {
  /**
   * 単一要求を検証（階層ルールA1-A4、グラフヘルスB2-B5）
   */
  static validateRequirement(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rules: ValidationRule[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      switch (rule.id) {
        // 階層ルール
        case 'A1':
          violations.push(...HierarchyValidator.validateParentChildTypes(req, allRequirements, rule));
          break;
        case 'A2':
          violations.push(...HierarchyValidator.validateParentExistence(req, rule));
          break;
        case 'A3':
          violations.push(...HierarchyValidator.detectCycles(req, allRequirements, rule));
          break;
        case 'A4':
          violations.push(...HierarchyValidator.validateMaxDepth(req, allRequirements, rule));
          break;
        case 'A5':
          violations.push(...HierarchyValidator.validateChildExistence(req, allRequirements, rule));
          break;

        // グラフヘルス（要求単位）
        case 'B2':
          violations.push(...GraphHealthValidator.validateFanOut(req, allRequirements, rule));
          break;
        case 'B3':
          violations.push(...GraphHealthValidator.detectOrphans(req, allRequirements, rule));
          break;
        case 'B4':
          violations.push(...GraphHealthValidator.validateConflictSymmetry(req, allRequirements, rule));
          break;
        case 'B5':
          violations.push(...GraphHealthValidator.validateDuplicateCandidates(req, allRequirements, rule));
          break;
      }
    }

    return violations;
  }

  /**
   * 全要求を検証（グラフ全体のDAGチェックB1を含む）
   */
  static validateAll(
    allRequirements: Map<string, Requirement>,
    rules: ValidationRule[]
  ): Map<string, ValidationViolation[]> {
    const violationsByReq = new Map<string, ValidationViolation[]>();

    // グラフ全体のチェック（B1: DAG）
    const dagRule = rules.find(r => r.id === 'B1' && r.enabled);
    if (dagRule) {
      const dagViolations = GraphHealthValidator.validateDAG(allRequirements, dagRule);
      for (const violation of dagViolations) {
        const existing = violationsByReq.get(violation.requirementId) || [];
        violationsByReq.set(violation.requirementId, [...existing, violation]);
      }
    }

    // 個別要求のチェック
    for (const [reqId, req] of allRequirements) {
      const violations = this.validateRequirement(req, allRequirements, rules);
      if (violations.length > 0) {
        const existing = violationsByReq.get(reqId) || [];
        violationsByReq.set(reqId, [...existing, ...violations]);
      }
    }

    return violationsByReq;
  }
}
