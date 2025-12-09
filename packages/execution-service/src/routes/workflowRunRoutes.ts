/**
 * Workflow Run Routes
 * 
 * /v1/workflows/:id/runs - New professional API
 */

import { Router } from 'express';
import {
    createRun,
    getRunStatus,
    cancelRun,
    getWorkflowRuns
} from '../controllers/workflowRunController';

const router = Router();

// Create and start a workflow run
router.post('/workflows/:id/runs', createRun);

// Get workflow runs history
router.get('/workflows/:id/runs', getWorkflowRuns);

// Get run status
router.get('/runs/:id/status', getRunStatus);

// Cancel a run
router.post('/runs/:id/cancel', cancelRun);

export default router;

