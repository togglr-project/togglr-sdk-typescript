#!/usr/bin/env node

/**
 * Post-processing script to fix exactOptionalPropertyTypes issues in generated OpenAPI code
 * This script modifies the generated configuration.ts file to be compatible with exactOptionalPropertyTypes: true
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE_PATH = path.join(__dirname, '..', 'src', 'generated', 'configuration.ts');

function fixConfigurationFile() {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      console.log('Configuration file not found, skipping fix...');
      return;
    }

    let content = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
    
    // Check if already fixed (contains the fix pattern)
    if (content.includes('if (param.apiKey !== undefined)') && !content.includes('this.formDataCtor = param.formDataCtor;')) {
      console.log('Configuration file already fixed, skipping...');
      return;
    }

    // Replace direct assignments with conditional assignments throughout the file
    let fixedContent = content
      .replace(/this\.apiKey = param\.apiKey;/g, 'if (param.apiKey !== undefined) {\n            this.apiKey = param.apiKey;\n        }')
      .replace(/this\.username = param\.username;/g, 'if (param.username !== undefined) {\n            this.username = param.username;\n        }')
      .replace(/this\.password = param\.password;/g, 'if (param.password !== undefined) {\n            this.password = param.password;\n        }')
      .replace(/this\.accessToken = param\.accessToken;/g, 'if (param.accessToken !== undefined) {\n            this.accessToken = param.accessToken;\n        }')
      .replace(/this\.basePath = param\.basePath;/g, 'if (param.basePath !== undefined) {\n            this.basePath = param.basePath;\n        }')
      .replace(/this\.serverIndex = param\.serverIndex;/g, 'if (param.serverIndex !== undefined) {\n            this.serverIndex = param.serverIndex;\n        }')
      .replace(/this\.formDataCtor = param\.formDataCtor;/g, 'if (param.formDataCtor !== undefined) {\n            this.formDataCtor = param.formDataCtor;\n        }');

    fs.writeFileSync(CONFIG_FILE_PATH, fixedContent, 'utf8');
    console.log('✅ Fixed exactOptionalPropertyTypes issues in configuration.ts');
    
  } catch (error) {
    console.error('❌ Error fixing configuration file:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  fixConfigurationFile();
}

module.exports = { fixConfigurationFile };
