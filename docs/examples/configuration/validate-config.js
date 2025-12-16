#!/usr/bin/env node

/**
 * Configuration Validation Script
 * 
 * This script validates configuration files and provides detailed feedback
 * about their format, compatibility, and migration requirements.
 * 
 * Usage:
 *   node validate-config.js [config-file.json]
 *   node validate-config.js --check-env
 */

import fs from 'fs/promises';
import path from 'path';
import { 
  ConfigurationManager,
  validateConfigurationFormat,
  generateConfigurationMigrationReport 
} from '../../../src/backend/config/index.js';

/**
 * Validates a configuration file
 */
async function validateConfigFile(filePath) {
  console.log(`🔍 Validating configuration file: ${filePath}\n`);

  try {
    // Read configuration file
    const configContent = await fs.readFile(filePath, 'utf-8');
    const config = JSON.parse(configContent);

    // Validate format
    const validation = validateConfigurationFormat(config);
    
    console.log('📋 Validation Results:');
    console.log(`  Format: ${validation.detectedFormat || 'Unknown'}`);
    console.log(`  Version: ${validation.version || 'Unknown'}`);
    console.log(`  Valid: ${validation.isValid ? '✅' : '❌'}\n`);

    if (validation.issues.length > 0) {
      console.log('⚠️ Issues Found:');
      validation.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      console.log();
    }

    if (validation.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      validation.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
      console.log();
    }

    // Generate migration report if needed
    if (!validation.isValid || validation.detectedFormat !== 'current') {
      console.log('📄 Migration Report:');
      console.log('===================\n');
      const report = generateConfigurationMigrationReport(config);
      console.log(report);
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ Configuration file not found: ${filePath}`);
    } else if (error instanceof SyntaxError) {
      console.error(`❌ Invalid JSON in configuration file: ${error.message}`);
    } else {
      console.error(`❌ Error validating configuration: ${error.message}`);
    }
    return false;
  }

  return true;
}

/**
 * Validates current environment configuration
 */
async function validateEnvironmentConfig() {
  console.log('🌍 Validating current environment configuration\n');

  try {
    // Initialize configuration manager
    const configManager = ConfigurationManager.getInstance();
    await configManager.initialize();

    console.log('✅ Configuration manager initialized successfully\n');

    // Get current environment
    const env = configManager.getEnvironment();
    console.log(`📍 Current environment: ${env}\n`);

    // Validate configuration
    const validation = configManager.validate();
    
    if (validation.valid) {
      console.log('✅ Configuration is valid\n');
    } else {
      console.log('❌ Configuration validation failed\n');
      
      console.log('🚨 Errors:');
      validation.errors.forEach(error => {
        console.log(`  - ${error.field}: ${error.message}`);
        if (error.suggestions && error.suggestions.length > 0) {
          error.suggestions.forEach(suggestion => {
            console.log(`    💡 ${suggestion}`);
          });
        }
      });
      console.log();
    }

    if (validation.warnings.length > 0) {
      console.log('⚠️ Warnings:');
      validation.warnings.forEach(warning => {
        console.log(`  - ${warning.field}: ${warning.message}`);
        if (warning.suggestion) {
          console.log(`    💡 ${warning.suggestion}`);
        }
      });
      console.log();
    }

    // Display configuration summary
    console.log('📊 Configuration Summary:');
    console.log('========================\n');
    
    const serverConfig = configManager.getServerConfig();
    console.log(`🖥️ Server: ${serverConfig.host}:${serverConfig.port}`);
    
    const apiConfig = configManager.getApiConfig();
    console.log(`🌐 API: ${apiConfig.baseUrl} (retries: ${apiConfig.maxRetries})`);
    
    const cacheConfig = configManager.getCacheConfig();
    console.log(`💾 Cache: ${cacheConfig.defaultMaxSize} items, ${cacheConfig.defaultTtlMs}ms TTL`);
    
    const envConfig = configManager.getEnvironmentConfig();
    console.log(`🔧 Environment: ${envConfig.environment} (debug: ${envConfig.debugEnabled})`);

    return validation.valid;

  } catch (error) {
    console.error(`❌ Environment validation failed: ${error.message}`);
    
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    
    console.error('\n💡 Suggestions:');
    console.error('  - Check that all required environment variables are set');
    console.error('  - Verify environment variable values are valid');
    console.error('  - Review configuration documentation for proper setup');
    
    return false;
  }
}

/**
 * Shows usage information
 */
function showUsage() {
  console.log('Configuration Validation Script');
  console.log('==============================\n');
  console.log('Usage:');
  console.log('  node validate-config.js [config-file.json]  # Validate a configuration file');
  console.log('  node validate-config.js --check-env         # Validate current environment');
  console.log('  node validate-config.js --help              # Show this help\n');
  console.log('Examples:');
  console.log('  node validate-config.js my-config.json');
  console.log('  node validate-config.js --check-env');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showUsage();
    return;
  }

  if (args.includes('--check-env')) {
    const success = await validateEnvironmentConfig();
    process.exit(success ? 0 : 1);
    return;
  }

  // Validate configuration file
  const configFile = args[0];
  
  if (!configFile) {
    console.error('❌ Please specify a configuration file to validate');
    showUsage();
    process.exit(1);
  }

  // Resolve file path
  const filePath = path.resolve(configFile);
  const success = await validateConfigFile(filePath);
  
  process.exit(success ? 0 : 1);
}

// Run the validation script
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});