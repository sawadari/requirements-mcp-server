import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface IdNamingRules {
  version: string;
  defaultRules: {
    format: string;
    numberFormat: string;
    numberPadding: number;
    separator: string;
  };
  typeBasedRules: Record<string, {
    prefix: string;
    description: string;
    example: string;
  }>;
  projectSpecificRules: Record<string, {
    projectName: string;
    useDefaultRules: boolean;
    customTypes: Record<string, {
      prefix: string;
      description: string;
      example: string;
    }>;
  }>;
}

export class IdGenerator {
  private rules: IdNamingRules;

  constructor(rulesPath?: string) {
    const configPath = rulesPath || path.join(__dirname, '../../config/id-naming-rules.json');
    this.rules = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  /**
   * プロジェクトと要求タイプに基づいて新しいIDを生成
   */
  generateId(
    projectId: string,
    requirementType: string,
    existingIds: string[]
  ): string {
    const prefix = this.getPrefix(projectId, requirementType);
    const nextNumber = this.getNextNumber(prefix, existingIds);
    const padding = this.rules.defaultRules.numberPadding;
    const paddedNumber = String(nextNumber).padStart(padding, '0');

    return `${prefix}${this.rules.defaultRules.separator}${paddedNumber}`;
  }

  /**
   * プロジェクトと要求タイプからID接頭辞を取得
   */
  private getPrefix(projectId: string, requirementType: string): string {
    // プロジェクト固有のルールを確認
    const projectRules = this.rules.projectSpecificRules[projectId];

    if (projectRules?.customTypes?.[requirementType]) {
      return projectRules.customTypes[requirementType].prefix;
    }

    // デフォルトルールを使用
    if (projectRules?.useDefaultRules && this.rules.typeBasedRules[requirementType]) {
      return this.rules.typeBasedRules[requirementType].prefix;
    }

    // タイプベースのルールを使用
    if (this.rules.typeBasedRules[requirementType]) {
      return this.rules.typeBasedRules[requirementType].prefix;
    }

    // フォールバック
    return 'REQ';
  }

  /**
   * 既存IDから次の番号を取得
   */
  private getNextNumber(prefix: string, existingIds: string[]): number {
    const separator = this.rules.defaultRules.separator;
    const matchingIds = existingIds.filter(id => id.startsWith(prefix + separator));

    if (matchingIds.length === 0) {
      return 1;
    }

    const numbers = matchingIds
      .map(id => {
        const parts = id.split(separator);
        return parseInt(parts[1]) || 0;
      })
      .filter(n => !isNaN(n));

    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  }

  /**
   * 利用可能な要求タイプとそのプレフィックスを取得
   */
  getAvailableTypes(projectId: string): Record<string, { prefix: string; description: string }> {
    const result: Record<string, { prefix: string; description: string }> = {};
    const projectRules = this.rules.projectSpecificRules[projectId];

    // プロジェクト固有のカスタムタイプ
    if (projectRules?.customTypes) {
      Object.entries(projectRules.customTypes).forEach(([type, config]) => {
        result[type] = {
          prefix: config.prefix,
          description: config.description
        };
      });
    }

    // デフォルトルールを追加（カスタムタイプで上書きされていないもの）
    if (projectRules?.useDefaultRules !== false) {
      Object.entries(this.rules.typeBasedRules).forEach(([type, config]) => {
        if (!result[type]) {
          result[type] = {
            prefix: config.prefix,
            description: config.description
          };
        }
      });
    }

    return result;
  }
}
