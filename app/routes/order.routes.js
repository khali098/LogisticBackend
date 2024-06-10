const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { order } = require('../models');

// Define routes
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
//router.post('/', orderController.createOrder);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);
router.post('/:userId/:productIds', orderController.createOrderr);
router.post('/:userId', orderController.createOrder);
router.put('/:orderId/status', orderController.updateOrderStatus);
router.get('/:orderId/status', orderController.getOrderStatus);
router.get('/generate-invoice/:orderId', orderController.generateInvoice)

module.exports = router;