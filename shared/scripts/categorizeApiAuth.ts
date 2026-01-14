/**
 * API Authentication Categorization Script
 * 
 * Analyzes all API integrations and categorizes them by authentication type.
 * Generates a categorized list for documentation.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ApiAuth {
  type: string;
  location?: string;
  urlPlaceholder?: string;
  headerName?: string;
  headerFormat?: string;
  secretKey?: string;
  parameterName?: string;
  queryParamName?: string;
  usernameSecretKey?: string;
  emailSecretKey?: string;
  accessKeyIdSecretKey?: string;
  regionSecretKey?: string;
}

interface ApiIntegration {
  id: string;
  name: string;
  authentication?: ApiAuth;
}

type AuthCategory = 
  | 'header-standard'
  | 'header-bearer'
  | 'header-basic'
  | 'query-parameter'
  | 'url-placeholder'
  | 'oauth2'
  | 'aws'
  | 'multi-secret'
  | 'unknown';

interface CategorizedApi {
  id: string;
  name: string;
  category: AuthCategory;
  details: string;
  fileName?: string;
}

function categorizeAuth(auth: ApiAuth | undefined): { category: AuthCategory; details: string } {
  if (!auth) {
    return { category: 'unknown', details: 'No authentication configured' };
  }

  // URL Placeholder (e.g., Telegram)
  if (auth.urlPlaceholder) {
    return {
      category: 'url-placeholder',
      details: `Token in URL path (placeholder: ${auth.urlPlaceholder})`
    };
  }

  // Query Parameter
  if (auth.location === 'query' || auth.queryParamName || auth.parameterName) {
    const paramName = auth.parameterName || auth.queryParamName || 'api_token';
    const hasMultiple = auth.usernameSecretKey || auth.emailSecretKey;
    return {
      category: hasMultiple ? 'multi-secret' : 'query-parameter',
      details: `Query parameter: ${paramName}${hasMultiple ? ' (multi-secret)' : ''}`
    };
  }

  // AWS Signature
  if (auth.type === 'aws' || auth.accessKeyIdSecretKey || auth.regionSecretKey) {
    return {
      category: 'aws',
      details: 'AWS Signature v4'
    };
  }

  // OAuth2
  if (auth.type === 'oauth2') {
    return {
      category: 'oauth2',
      details: 'OAuth2 authentication'
    };
  }

  // Basic Authentication
  if (auth.type === 'basic' || (auth.headerFormat && auth.headerFormat.includes('Basic'))) {
    return {
      category: 'header-basic',
      details: 'HTTP Basic Authentication'
    };
  }

  // Bearer Token (Header)
  if (auth.type === 'bearer' || (auth.headerFormat && auth.headerFormat.includes('Bearer'))) {
    return {
      category: 'header-bearer',
      details: `Header: ${auth.headerName || 'Authorization'} (Bearer)`
    };
  }

  // Multi-Secret (Header with multiple secrets)
  if (auth.usernameSecretKey || auth.emailSecretKey) {
    return {
      category: 'multi-secret',
      details: `Header: ${auth.headerName || 'Authorization'} (multiple secrets)`
    };
  }

  // Standard Header Authentication
  if (auth.headerName || auth.headerFormat) {
    return {
      category: 'header-standard',
      details: `Header: ${auth.headerName || 'Authorization'} (${auth.headerFormat || 'standard'})`
    };
  }

  // Default: API Key (assumed header)
  return {
    category: 'header-standard',
    details: `API Key (assumed header: ${auth.secretKey || 'unknown'})`
  };
}

function loadAllApiIntegrations(): Array<ApiIntegration & { fileName?: string }> {
  const apiDir = path.join(__dirname, '../apiIntegrations');
  const files = fs.readdirSync(apiDir).filter(f => 
    f.endsWith('.json') && f !== 'index.json' // Exclude index.json
  );
  
  const integrations: Array<ApiIntegration & { fileName?: string }> = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(apiDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const integration: ApiIntegration = JSON.parse(content);
      integrations.push({ ...integration, fileName: file });
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }
  
  return integrations;
}

function generateCategorizedList(): Map<AuthCategory, CategorizedApi[]> {
  const integrations = loadAllApiIntegrations();
  const categorized = new Map<AuthCategory, CategorizedApi[]>();
  
  for (const integration of integrations) {
    const { category, details } = categorizeAuth(integration.authentication);
    
    if (!categorized.has(category)) {
      categorized.set(category, []);
    }
    
    categorized.get(category)!.push({
      id: integration.id || 'undefined',
      name: integration.name || 'undefined',
      category,
      details,
      fileName: integration.fileName
    });
  }
  
  // Sort each category alphabetically by name
  for (const [category, apis] of categorized.entries()) {
    apis.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  return categorized;
}

function generateMarkdown(categorized: Map<AuthCategory, CategorizedApi[]>): string {
  const categoryNames: Record<AuthCategory, string> = {
    'header-standard': 'Header Authentication (Standard)',
    'header-bearer': 'Header Authentication (Bearer Token)',
    'header-basic': 'Header Authentication (Basic)',
    'query-parameter': 'Query Parameter Authentication',
    'url-placeholder': 'URL Placeholder Authentication',
    'oauth2': 'OAuth2 Authentication',
    'aws': 'AWS Signature Authentication',
    'multi-secret': 'Multi-Secret Authentication',
    'unknown': 'Unknown/No Authentication'
  };
  
  const categoryOrder: AuthCategory[] = [
    'header-bearer',
    'header-standard',
    'header-basic',
    'query-parameter',
    'url-placeholder',
    'aws',
    'multi-secret',
    'oauth2',
    'unknown'
  ];
  
  let markdown = '# API Integrations - Complete Categorization\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `**Total APIs:** ${Array.from(categorized.values()).reduce((sum, apis) => sum + apis.length, 0)}\n\n`;
  markdown += '---\n\n';
  
  for (const category of categoryOrder) {
    const apis = categorized.get(category);
    if (!apis || apis.length === 0) continue;
    
    markdown += `## ${categoryNames[category]}\n\n`;
    markdown += `**Count:** ${apis.length}\n\n`;
    markdown += '| API Name | ID | Details |\n';
    markdown += '|----------|----|---------|\n';
    
    for (const api of apis) {
      markdown += `| ${api.name} | \`${api.id}\` | ${api.details} |\n`;
    }
    
    markdown += '\n';
  }
  
  return markdown;
}

function main() {
  console.log('Analyzing API integrations...');
  const categorized = generateCategorizedList();
  
  console.log('\nSummary:');
  for (const [category, apis] of categorized.entries()) {
    console.log(`  ${category}: ${apis.length} APIs`);
    if (category === 'unknown' && apis.length > 0) {
      console.log('\n⚠️  Unknown APIs:');
      for (const api of apis) {
        console.log(`    - ${api.name} (${api.id}) - File: ${api.fileName || 'unknown'}`);
      }
    }
  }
  
  const markdown = generateMarkdown(categorized);
  const outputPath = path.join(__dirname, '../../docs/API_INTEGRATIONS_AUTH_CATEGORIES.md');
  
  // Read existing file and replace the categorization section
  let existingContent = '';
  if (fs.existsSync(outputPath)) {
    existingContent = fs.readFileSync(outputPath, 'utf-8');
  }
  
  // Find the section to replace (everything after "## Kategorisierung aller APIs")
  const sectionStart = existingContent.indexOf('## Kategorisierung aller APIs');
  if (sectionStart !== -1) {
    // Keep everything before the section
    const beforeSection = existingContent.substring(0, sectionStart);
    const newContent = beforeSection + '\n' + markdown;
    fs.writeFileSync(outputPath, newContent, 'utf-8');
  } else {
    // If section doesn't exist, append to file
    const newContent = existingContent + '\n\n' + markdown;
    fs.writeFileSync(outputPath, newContent, 'utf-8');
  }
  
  console.log(`\n✅ Categorization written to: ${outputPath}`);
}

if (require.main === module) {
  main();
}

export { categorizeAuth, loadAllApiIntegrations, generateCategorizedList };

