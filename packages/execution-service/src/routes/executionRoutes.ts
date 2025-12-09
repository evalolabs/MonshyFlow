import { Router } from 'express';
import { executionController } from '../controllers/executionController';

const router = Router();

// Execute single node (for testing/debugging)
router.post('/node', (req, res) => executionController.executeNode(req, res));

// Execute node with full workflow context (for debug panel)
router.post('/test-node-with-context', (req, res) => executionController.testNodeWithContext(req, res));

// Execute workflow
router.post('/:workflowId', (req, res) => executionController.executeWorkflow(req, res));

// Get execution status
router.get('/:executionId/status', (req, res) => executionController.getExecutionStatus(req, res));

// Cancel execution
router.post('/:executionId/cancel', (req, res) => executionController.cancelExecution(req, res));

export default router;

