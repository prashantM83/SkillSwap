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

router.use(protect);

router.post("/", createSwap);
router.get("/", getAllSwaps);
router.get("/sent", getSentSwaps);
router.get("/received", getReceivedSwaps);
router.get("/:id", getSwapById);
router.put("/:id", updateSwapStatus);
router.delete("/:id", deleteSwap);

module.exports = router;
