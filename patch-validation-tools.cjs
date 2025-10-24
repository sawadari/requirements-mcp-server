const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/tools/validation-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the validateRequirement method to normalize ID
const oldPattern = /async validateRequirement\(id: string\): Promise<ValidationResult> \{\s+logger\.info\(`Validating requirement: \$\{id\}`\);/;
const replacement = `async validateRequirement(id: string): Promise<ValidationResult> {
    // Normalize ID to uppercase
    const normalizedId = id.toUpperCase();
    logger.info(\`Validating requirement: \${normalizedId}\`);`;

if (content.match(oldPattern)) {
  content = content.replace(oldPattern, replacement);
  // Also need to update the storage call
  content = content.replace(
    /const requirement = await this\.storage\.getRequirement\(id\);/,
    'const requirement = await this.storage.getRequirement(normalizedId);'
  );
  content = content.replace(
    /throw new Error\(`Requirement not found: \$\{id\}`\);/,
    'throw new Error(`Requirement not found: ${normalizedId}`);'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully patched validation-tools.ts');
  console.log('Added ID normalization (toUpperCase)');
} else {
  console.error('❌ Could not find pattern to replace');
  process.exit(1);
}
