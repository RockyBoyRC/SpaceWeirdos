import { Router, Request, Response } from 'express';
import { WarbandService } from '../services/WarbandService';
import { DataRepository } from '../services/DataRepository';
import { CostEngine } from '../services/CostEngine';
import { ValidationService } from '../services/ValidationService';
import { Weirdo } from '../models/types';

/**
 * Warband API Router
 * Provides REST endpoints for warband management
 */
export function createWarbandRouter(repository: DataRepository): Router {
  const router = Router();
  const warbandService = new WarbandService(repository);
  const costEngine = new CostEngine();
  const validationService = new ValidationService();

  /**
   * POST /api/warbands
   * Create a new warband
   */
  router.post('/warbands', (req: Request, res: Response) => {
    try {
      const { name, pointLimit, ability } = req.body;

      // Validate required fields
      if (!name || !pointLimit || !ability) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'name, pointLimit, and ability are required'
        });
      }

      // Validate point limit
      if (pointLimit !== 75 && pointLimit !== 125) {
        return res.status(400).json({
          error: 'Invalid point limit',
          details: 'Point limit must be 75 or 125'
        });
      }

      const warband = warbandService.createWarband({ name, pointLimit, ability });
      res.status(201).json(warband);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to create warband',
        details: error.message
      });
    }
  });

  /**
   * GET /api/warbands
   * Get all warbands
   */
  router.get('/warbands', (_req: Request, res: Response) => {
    try {
      const warbands = warbandService.getAllWarbands();
      res.json(warbands);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve warbands',
        details: error.message
      });
    }
  });

  /**
   * GET /api/warbands/:id
   * Get a specific warband by ID
   */
  router.get('/warbands/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const warband = warbandService.getWarband(id);

      if (!warband) {
        return res.status(404).json({
          error: 'Warband not found',
          details: `No warband found with id: ${id}`
        });
      }

      res.json(warband);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to retrieve warband',
        details: error.message
      });
    }
  });

  /**
   * PUT /api/warbands/:id
   * Update an existing warband
   */
  router.put('/warbands/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const warband = warbandService.updateWarband(id, updates);
      res.json(warband);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Warband not found',
          details: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to update warband',
        details: error.message
      });
    }
  });

  /**
   * DELETE /api/warbands/:id
   * Delete a warband
   */
  router.delete('/warbands/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = warbandService.deleteWarband(id);

      if (!deleted) {
        return res.status(404).json({
          error: 'Warband not found',
          details: `No warband found with id: ${id}`
        });
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to delete warband',
        details: error.message
      });
    }
  });

  /**
   * POST /api/warbands/:id/weirdos
   * Add a weirdo to a warband
   */
  router.post('/warbands/:id/weirdos', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const weirdo: Weirdo = req.body;

      // Load existing warband
      const warband = warbandService.getWarband(id);
      if (!warband) {
        return res.status(404).json({
          error: 'Warband not found',
          details: `No warband found with id: ${id}`
        });
      }

      // Add weirdo to warband
      warband.weirdos.push(weirdo);

      // Update warband (recalculates costs)
      const updatedWarband = warbandService.updateWarband(id, warband);
      res.status(201).json(updatedWarband);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to add weirdo',
        details: error.message
      });
    }
  });

  /**
   * PUT /api/warbands/:id/weirdos/:weirdoId
   * Update a weirdo in a warband
   */
  router.put('/warbands/:id/weirdos/:weirdoId', (req: Request, res: Response) => {
    try {
      const { id, weirdoId } = req.params;
      const updatedWeirdo: Weirdo = req.body;

      // Load existing warband
      const warband = warbandService.getWarband(id);
      if (!warband) {
        return res.status(404).json({
          error: 'Warband not found',
          details: `No warband found with id: ${id}`
        });
      }

      // Find and update weirdo
      const weirdoIndex = warband.weirdos.findIndex(w => w.id === weirdoId);
      if (weirdoIndex === -1) {
        return res.status(404).json({
          error: 'Weirdo not found',
          details: `No weirdo found with id: ${weirdoId}`
        });
      }

      warband.weirdos[weirdoIndex] = updatedWeirdo;

      // Update warband (recalculates costs)
      const updatedWarband = warbandService.updateWarband(id, warband);
      res.json(updatedWarband);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to update weirdo',
        details: error.message
      });
    }
  });

  /**
   * DELETE /api/warbands/:id/weirdos/:weirdoId
   * Remove a weirdo from a warband
   */
  router.delete('/warbands/:id/weirdos/:weirdoId', (req: Request, res: Response) => {
    try {
      const { id, weirdoId } = req.params;

      // Load existing warband
      const warband = warbandService.getWarband(id);
      if (!warband) {
        return res.status(404).json({
          error: 'Warband not found',
          details: `No warband found with id: ${id}`
        });
      }

      // Find and remove weirdo
      const weirdoIndex = warband.weirdos.findIndex(w => w.id === weirdoId);
      if (weirdoIndex === -1) {
        return res.status(404).json({
          error: 'Weirdo not found',
          details: `No weirdo found with id: ${weirdoId}`
        });
      }

      warband.weirdos.splice(weirdoIndex, 1);

      // Update warband (recalculates costs)
      const updatedWarband = warbandService.updateWarband(id, warband);
      res.json(updatedWarband);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to remove weirdo',
        details: error.message
      });
    }
  });

  /**
   * POST /api/calculate-cost
   * Calculate cost for a weirdo or warband
   */
  router.post('/calculate-cost', (req: Request, res: Response) => {
    try {
      const { weirdo, warband, warbandAbility } = req.body;

      if (weirdo && warbandAbility) {
        // Calculate weirdo cost
        const cost = costEngine.calculateWeirdoCost(weirdo, warbandAbility);
        return res.json({ cost });
      }

      if (warband) {
        // Calculate warband cost
        const cost = costEngine.calculateWarbandCost(warband);
        return res.json({ cost });
      }

      res.status(400).json({
        error: 'Invalid request',
        details: 'Must provide either (weirdo + warbandAbility) or warband'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to calculate cost',
        details: error.message
      });
    }
  });

  /**
   * POST /api/validate
   * Validate a weirdo or warband
   */
  router.post('/validate', (req: Request, res: Response) => {
    try {
      const { weirdo, warband } = req.body;

      if (weirdo && warband) {
        // Validate weirdo within warband context
        const errors = validationService.validateWeirdo(weirdo, warband);
        return res.json({
          valid: errors.length === 0,
          errors
        });
      }

      if (warband) {
        // Validate entire warband
        const result = validationService.validateWarband(warband);
        return res.json(result);
      }

      res.status(400).json({
        error: 'Invalid request',
        details: 'Must provide either (weirdo + warband) or warband'
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to validate',
        details: error.message
      });
    }
  });

  return router;
}
