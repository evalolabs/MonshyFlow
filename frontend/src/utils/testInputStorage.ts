/**
 * Test Input Storage Utility
 * 
 * Manages persistent storage of test input values for workflow nodes.
 * Uses localStorage to save test data per workflow and node.
 */

export interface StoredTestInput {
  inputData: any;
  lastUsed: string; // ISO timestamp
  schemaVersion?: string; // Optional: track schema version for migration
}

export interface WorkflowTestInputs {
  [nodeId: string]: StoredTestInput;
}

class TestInputStorage {
  private readonly PREFIX = 'workflow-test-inputs';

  /**
   * Get storage key for a workflow
   */
  private getStorageKey(workflowId: string): string {
    return `${this.PREFIX}-${workflowId}`;
  }

  /**
   * Save test input for a specific node in a workflow
   */
  save(workflowId: string, nodeId: string, inputData: any, schemaVersion?: string): void {
    if (!workflowId || !nodeId) {
      console.warn('[TestInputStorage] Cannot save: workflowId or nodeId is missing');
      return;
    }

    try {
      const key = this.getStorageKey(workflowId);
      const allInputs = this.loadAll(workflowId);

      allInputs[nodeId] = {
        inputData,
        lastUsed: new Date().toISOString(),
        ...(schemaVersion && { schemaVersion }),
      };

      localStorage.setItem(key, JSON.stringify(allInputs));
      /* console.log(`[TestInputStorage] Saved test input for node ${nodeId} in workflow ${workflowId}`); */
    } catch (error) {
      console.error('[TestInputStorage] Failed to save test input:', error);
    }
  }

  /**
   * Load test input for a specific node
   */
  load(workflowId: string, nodeId: string): any | null {
    if (!workflowId || !nodeId) {
      return null;
    }

    try {
      const allInputs = this.loadAll(workflowId);
      const stored = allInputs[nodeId];

      if (stored && stored.inputData) {
        /* console.log(`[TestInputStorage] Loaded test input for node ${nodeId} (last used: ${stored.lastUsed})`); */
        return stored.inputData;
      }

      return null;
    } catch (error) {
      console.error('[TestInputStorage] Failed to load test input:', error);
      return null;
    }
  }

  /**
   * Load all test inputs for a workflow
   */
  loadAll(workflowId: string): WorkflowTestInputs {
    if (!workflowId) {
      return {};
    }

    try {
      const key = this.getStorageKey(workflowId);
      const stored = localStorage.getItem(key);

      if (stored) {
        return JSON.parse(stored) as WorkflowTestInputs;
      }

      return {};
    } catch (error) {
      console.error('[TestInputStorage] Failed to load all test inputs:', error);
      return {};
    }
  }

  /**
   * Check if test input exists for a node
   */
  has(workflowId: string, nodeId: string): boolean {
    return this.load(workflowId, nodeId) !== null;
  }

  /**
   * Get metadata about stored test input (last used timestamp, etc.)
   */
  getMetadata(workflowId: string, nodeId: string): Omit<StoredTestInput, 'inputData'> | null {
    if (!workflowId || !nodeId) {
      return null;
    }

    try {
      const allInputs = this.loadAll(workflowId);
      const stored = allInputs[nodeId];

      if (stored) {
        const { inputData, ...metadata } = stored;
        return metadata;
      }

      return null;
    } catch (error) {
      console.error('[TestInputStorage] Failed to get metadata:', error);
      return null;
    }
  }

  /**
   * Clear test input for a specific node
   */
  clear(workflowId: string, nodeId: string): void {
    if (!workflowId || !nodeId) {
      return;
    }

    try {
      const key = this.getStorageKey(workflowId);
      const allInputs = this.loadAll(workflowId);

      delete allInputs[nodeId];

      if (Object.keys(allInputs).length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(allInputs));
      }

      /* console.log(`[TestInputStorage] Cleared test input for node ${nodeId} in workflow ${workflowId}`); */
    } catch (error) {
      console.error('[TestInputStorage] Failed to clear test input:', error);
    }
  }

  /**
   * Clear all test inputs for a workflow
   */
  clearAll(workflowId: string): void {
    if (!workflowId) {
      return;
    }

    try {
      const key = this.getStorageKey(workflowId);
      localStorage.removeItem(key);
      console.log(`[TestInputStorage] Cleared all test inputs for workflow ${workflowId}`);
    } catch (error) {
      console.error('[TestInputStorage] Failed to clear all test inputs:', error);
    }
  }

  /**
   * Validate that stored input matches current schema (optional migration)
   */
  validateAgainstSchema(storedInput: any, schema: any): boolean {
    if (!schema || !schema.properties) {
      return true; // No schema = accept anything
    }

    // Basic validation: check if all required fields are present
    const required = schema.required || [];
    for (const field of required) {
      if (!(field in storedInput)) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const testInputStorage = new TestInputStorage();

