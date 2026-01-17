/**
 * Config Form Registry
 * 
 * Central registry for custom config form components.
 * This allows custom forms (like StartNodeConfigForm) to be registered
 * and automatically used by NodeConfigPanel.
 */

import type { ComponentType } from 'react';
import { StartNodeConfigForm } from '../NodeConfigForms/StartNodeConfigForm';
import { CodeNodeConfigForm } from '../NodeConfigForms/CodeNodeConfigForm';

// Registry for custom config form components
const CUSTOM_CONFIG_FORMS: Record<string, ComponentType<any>> = {
  'start': StartNodeConfigForm,
  'code': CodeNodeConfigForm,
  // Add more custom forms here as needed
  // 'my-custom-node': MyCustomNodeConfigForm,
};

/**
 * Get custom config form component for a node type
 */
export function getCustomConfigForm(nodeType: string): ComponentType<any> | null {
  return CUSTOM_CONFIG_FORMS[nodeType] || null;
}

/**
 * Register a custom config form component
 */
export function registerCustomConfigForm(
  nodeType: string,
  component: ComponentType<any>
): void {
  if (CUSTOM_CONFIG_FORMS[nodeType]) {
    console.warn(`[ConfigFormRegistry] Custom form for "${nodeType}" already exists. Overwriting.`);
  }
  CUSTOM_CONFIG_FORMS[nodeType] = component;
  console.log(`[ConfigFormRegistry] Registered custom config form: ${nodeType}`);
}

/**
 * Check if a node type has a custom config form
 */
export function hasCustomConfigForm(nodeType: string): boolean {
  return nodeType in CUSTOM_CONFIG_FORMS;
}

