const express = require("express");
const router = express.Router();
const {
  createSwap,
  getAllSwaps,
  getSwapById,
  updateSwapStatus,
  deleteSwap,
  getSentSwaps,
  getReceivedSwaps,
} = require("../controllers/swapController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /api/swaps:
 *   post:
 *     tags: [Swaps]
 *     summary: Create a new swap request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SwapRequest'
 *     responses:
 *       201:
 *         description: Swap created
 *   get:
 *     tags: [Swaps]
 *     summary: Get swaps for current user (or all swaps for admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Swap list
 */

router.use(protect);

router.post("/", createSwap);
router.get("/", getAllSwaps);

/**
 * @swagger
 * /api/swaps/sent:
 *   get:
 *     tags: [Swaps]
 *     summary: Get swap requests sent by current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sent swaps
 */
router.get("/sent", getSentSwaps);

/**
 * @swagger
 * /api/swaps/received:
 *   get:
 *     tags: [Swaps]
 *     summary: Get swap requests received by current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Received swaps
 */
router.get("/received", getReceivedSwaps);

/**
 * @swagger
 * /api/swaps/{id}:
 *   get:
 *     tags: [Swaps]
 *     summary: Get swap by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Swap details
 *   put:
 *     tags: [Swaps]
 *     summary: Update swap status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected, completed, cancelled]
 *     responses:
 *       200:
 *         description: Swap updated
 *   delete:
 *     tags: [Swaps]
 *     summary: Delete/cancel swap
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Swap deleted
 */
router.get("/:id", getSwapById);
router.put("/:id", updateSwapStatus);
router.delete("/:id", deleteSwap);

module.exports = router;
