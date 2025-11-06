/**
 * OntologyLoader - オントロジースキーマのロードと管理
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { OntologyManager } from './ontology-manager.js';
import { createLogger } from '../common/logger.js';
const logger = createLogger('OntologyLoader');
export class OntologyLoader {
    /**
     * ファイルからオントロジースキーマをロード
     */
    static async loadFromFile(filePath) {
        try {
            logger.info('Loading ontology schema', { filePath });
            const content = await fs.readFile(filePath, 'utf-8');
            const schema = JSON.parse(content);
            const manager = new OntologyManager(schema);
            // スキーマの妥当性検証
            const validation = manager.validateSchema();
            if (!validation.valid) {
                logger.error('Invalid ontology schema', {
                    errors: validation.errors,
                    filePath,
                });
                throw new Error(`Invalid ontology schema: ${validation.errors.map((e) => e.message).join(', ')}`);
            }
            logger.info('Ontology schema loaded successfully', {
                version: schema.version,
                stagesCount: schema.stages.length,
            });
            return manager;
        }
        catch (error) {
            logger.error('Failed to load ontology schema', {
                filePath,
                error: error.message,
            });
            throw new Error(`Failed to load ontology schema from ${filePath}: ${error.message}`);
        }
    }
    /**
     * デフォルトのオントロジースキーマをロード
     */
    static async loadDefault() {
        const defaultPath = path.join(process.cwd(), 'config', 'ontology-schema.json');
        logger.info('Loading default ontology schema', { path: defaultPath });
        return await OntologyLoader.loadFromFile(defaultPath);
    }
    /**
     * 環境変数で指定されたスキーマをロード
     */
    static async loadFromEnvironment() {
        const ontologyPath = process.env.ONTOLOGY_SCHEMA_PATH;
        if (ontologyPath) {
            logger.info('Loading ontology from environment variable', {
                path: ontologyPath,
            });
            return await OntologyLoader.loadFromFile(ontologyPath);
        }
        logger.info('No environment variable set, loading default ontology');
        return await OntologyLoader.loadDefault();
    }
    /**
     * スキーマをファイルに保存
     */
    static async saveToFile(manager, filePath) {
        try {
            const schema = manager.exportSchema();
            const content = JSON.stringify(schema, null, 2);
            await fs.writeFile(filePath, content, 'utf-8');
            logger.info('Ontology schema saved', { filePath });
        }
        catch (error) {
            logger.error('Failed to save ontology schema', {
                filePath,
                error: error.message,
            });
            throw new Error(`Failed to save ontology schema to ${filePath}: ${error.message}`);
        }
    }
    /**
     * 利用可能なオントロジースキーマをリスト
     */
    static async listAvailable(directory = './config') {
        try {
            const files = await fs.readdir(directory);
            const ontologyFiles = files.filter((f) => f.startsWith('ontology-') && f.endsWith('.json'));
            logger.info('Found ontology schemas', {
                directory,
                count: ontologyFiles.length,
                files: ontologyFiles,
            });
            return ontologyFiles.map((f) => path.join(directory, f));
        }
        catch (error) {
            logger.error('Failed to list ontology schemas', {
                directory,
                error: error.message,
            });
            return [];
        }
    }
}
