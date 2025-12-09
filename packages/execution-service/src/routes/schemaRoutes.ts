import { Router } from 'express';
import { schemaController } from '../controllers/schemaController';

const router = Router();

// Get schema for a specific node type
// Support multiple route patterns for optional parameters
// Examples:
//   /api/schemas/email/1.0
//   /api/schemas/httpRequest/1.0/request
//   /api/schemas/httpRequest/1.0/request/get
router.get('/:nodeType/:version', (req, res) => 
    schemaController.getSchema(req, res)
);

router.get('/:nodeType/:version/:resource', (req, res) => 
    schemaController.getSchema(req, res)
);

router.get('/:nodeType/:version/:resource/:operation', (req, res) => 
    schemaController.getSchema(req, res)
);

// Get all registered node types (for frontend auto-discovery)
router.get('/nodes', (req, res) => 
    schemaController.getAllNodes(req, res)
);

export default router;

