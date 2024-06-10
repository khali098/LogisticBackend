const db = require('../models');
const Order = db.order;
const Customer = db.customer;
const Product = db.product;
const User = db.user;
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [Customer, Product, User]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [Customer, Product, User]
    });
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*exports.createOrder = async (req, res) => {
  try {
    const { ref, value, deliveryDate, customerId, userId, productIds } = req.body;

    // Create order
    const order = await Order.create({
      ref,
      value,
      deliveryDate,
      customerId,
      userId
    });

    // Associate products with the order
    if (productIds && productIds.length > 0) {
      await order.addProducts(productIds);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};*/



exports.createOrderr = async (req, res) => {
  try {
    const { userId, productIds } = req.params;
    const { ref, value, deliveryLocation, deliveryDate, customerInfo } = req.body;

    // Retrieve or create the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve or create the customer
    let customer;
    if (customerInfo && customerInfo.email) {
      // If customer email is provided, try to find an existing customer
      customer = await Customer.findOne({ where: { email: customerInfo.email } });
    }

    if (!customer) {
      // If customer doesn't exist, create a new one
      customer = await Customer.create(customerInfo);
    }

    // Retrieve products
    const productIdsArray = productIds.split(',').map(id => parseInt(id));
    const products = await Product.findAll({ where: { id: productIdsArray } });

    if (products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    // Calculate total price
    const totalPrice = products.reduce((acc, product) => acc + product.price, 0);

    // Create order
    const order = await Order.create({
      userId,
      customerId: customer.id,
      ref,
      value,
      totalPrice,
      deliveryLocation,
      deliveryDate
    });

    // Associate products with the order
    await order.addProducts(products);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order) {
      const { ref, value, deliveryDate, customerId, userId, productIds } = req.body;
      await order.update({
        ref,
        value,
        deliveryDate,
        customerId,
        userId
      });

      // Associate products with the order
      if (productIds && productIds.length > 0) {
        await order.setProducts(productIds);
      }

      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order) {
      await order.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*exports.createOrder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { ref, deliveryLocation, deliveryDate, customerInfo, products } = req.body;

    // Retrieve or create the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Retrieve or create the customer
    let customer;
    if (customerInfo && customerInfo.email) {
      // If customer email is provided, try to find an existing customer
      customer = await Customer.findOne({ where: { email: customerInfo.email } });
    }

    if (!customer) {
      // If customer doesn't exist, create a new one
      customer = await Customer.create(customerInfo);
    }

    // Create order
    const order = await Order.create({
      userId,
      customerId: customer.id,
      ref,
      value: 0, // Initial total price
      deliveryLocation,
      deliveryDate
    });

    let totalPrice = 0;

    // Process each product in the order
    for (const { productId, quantity } of products) {
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }

      if (product.quantity < quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }

      // Decrease product quantity
      product.quantity -= quantity;
      await product.save();

      // Add product to the order with the specified quantity
      await order.addProduct(product, { through: { quantity } });

      // Update total price
      totalPrice += product.buyPrice * quantity;

      // Check if quantity is below the minimum stock level
      if (product.quantity < product.minStockLevel) {
        sendLowStockAlert(product.name, 'hazembensalem77@gmail.com');
      }
    }

    // Update the order's total price
    order.value = totalPrice;
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: error.message });
  }
};*/


function sendLowStockAlert(productName, userEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hazembensalem77@gmail.com', // Update with your email
      pass: 'efcrbuwgbygwxcvs' // Update with your password
    }
  });

  const mailOptions = {
    from: 'hazembensalem77@gmail.com',
    to: userEmail,
    subject: 'Low Stock Alert',
    text: `The stock for ${productName} is running low. Please replenish.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Low stock alert email sent:', info.response);
    }
  });
}

function sendStatusAlert(orderRef , orderStatus, userEmail) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hazembensalem77@gmail.com', // Update with your email
      pass: 'efcrbuwgbygwxcvs' // Update with your password
    }
  });

  const mailOptions = {
    from: 'hazembensalem77@gmail.com',
    to: userEmail,
    subject: 'Order Status Alert',
    text: `Please notice that order with reference ${orderRef} is changing status to ${orderStatus}.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Order Status alert email sent:', info.response);
    }
  });
}

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();
    sendStatusAlert(order.ref,order.status,'hazembensalem77@gmail.com')

    res.status(200).json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ status: order.status });
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({ message: error.message });
  }
};

/*exports.generateInvoice = async (req, res) => {
  const { orderId } = req.params;

  try {
      const order = await Order.findByPk(orderId, {
          include: [
              { model: Customer },
              { model: Product }
          ]
      });

      if (!order) {
          return res.status(404).json({ error: 'Order not found' });
      }

      const doc = new PDFDocument();
      const filePath = `invoices/invoice_${order.ref}.pdf`;

      doc.pipe(fs.createWriteStream(filePath));

      doc.fontSize(25).text('Invoice', { align: 'center' });

      const customer = order.customer;
      doc.fontSize(14).text(`Order Ref: ${order.ref}`);
      doc.text(`Customer: ${customer.firstname} ${customer.lastname}`);
      doc.text(`Email: ${customer.email}`);
      doc.text(`Phone: ${customer.phone}`);
      doc.text(`Address: ${customer.address}`);
      doc.text(`Delivery Location: ${order.deliveryLocation}`);
      doc.text(`Delivery Date: ${order.deliveryDate.toISOString().split('T')[0]}`);

      doc.moveDown();
      doc.text('Items:');
      order.products.forEach(product => {
          doc.text(`${product.name} - ${product.quantity} x $${product.buyPrice}`);
      });

      doc.moveDown();
      doc.text(`Total: $${order.value}`);
      doc.text(`Status: ${order.status}`);

      doc.end();

      res.download(filePath, `invoice_${order.ref}.pdf`, err => {
          if (err) {
              console.error(err);
              res.status(500).json({ error: 'Could not download the file' });
          }
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
}*/

exports.createOrder = async (req, res) => {
  try {
    const { userId } = req.params;
    const { ref, deliveryLocation, deliveryDate, customerInfo, products } = req.body;

    const user = await db.user.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let customer;
    if (customerInfo && customerInfo.email) {
      customer = await db.customer.findOne({ where: { email: customerInfo.email } });
    }

    if (!customer) {
      customer = await db.customer.create(customerInfo);
    }

    const order = await db.order.create({
      userId,
      customerId: customer.id,
      ref,
      value: 0,
      deliveryLocation,
      deliveryDate
    });

    let totalPrice = 0;

    for (const { productId, quantity } of products) {
      const product = await db.product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${productId} not found` });
      }

      if (product.quantity < quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }

      product.quantity -= quantity;
      await product.save();

      await order.addProduct(product, { through: { quantity, price: product.buyPrice } });

      totalPrice += product.buyPrice * quantity;

      if (product.quantity < product.minStockLevel) {
        sendLowStockAlert(product.name, 'hazembensalem77@gmail.com');
      }
    }

    order.value = totalPrice;
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.generateInvoice = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await db.order.findByPk(orderId, {
      include: [
        { model: db.customer },
        {
          model: db.product,
          through: {
            attributes: ['quantity', 'price']
          }
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(JSON.stringify(order, null, 2)); // Log the order details

    const timestamp = new Date().getTime(); // Get current timestamp
    const filePath = `invoices/invoice_${order.ref}_${timestamp}.pdf`; // Append timestamp to filename

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.font('Helvetica-Bold').fontSize(25).fillColor('#444444').text('INVOICE', { align: 'center' }).moveDown();
    doc.font('Helvetica').fontSize(10).fillColor('#444444').text(`Invoice Ref: ${order.ref}`, { align: 'right' });

    // Customer Info
    const customer = order.customer;
    doc.fontSize(14).fillColor('#000000').text(`Order Ref: ${order.ref}`);
    doc.text(`Customer: ${customer.firstname} ${customer.lastname}`);
    doc.text(`Email: ${customer.email}`);
    doc.text(`Phone: ${customer.phone}`);
    doc.text(`Address: ${customer.address}`);
    doc.text(`Delivery Location: ${order.deliveryLocation}`);
    doc.text(`Delivery Date: ${order.deliveryDate.toISOString().split('T')[0]}`);

    // Order Info
    doc.moveDown();
    doc.fontSize(12).fillColor('#000000').text('Order Details', { underline: true });
    doc.fontSize(10).text(`Status: ${order.status}`).moveDown();

    // Table Header
    doc.fontSize(12).fillColor('#000000').text('Items', { underline: true }).moveDown();
    doc.fontSize(10).fillColor('#444444');
    doc.text('Name', { width: 220, continued: true });
    doc.text('    Quantity', { width: 120, continued: true });
    doc.text('    Unit Price', { width: 120, continued: true });
    doc.text('    Total Price', { align: 'right' }).moveDown();

    // Table Rows
    let totalValue = 0;
    order.products.forEach(product => {
      const orderProduct = product.order_products; // Make sure this is the correct field
      if (!orderProduct) {
        console.error(`Missing order_products data for product ${product.id}`);
        return;
      }

      const quantity = orderProduct.quantity;
      const price = orderProduct.price;
      const productTotal = quantity * price;
      totalValue += productTotal;
      doc.fontSize(10).fillColor('#000000');
      doc.text(product.name, { width: 220, continued: true });
      doc.text(quantity.toString(), { width: 120, continued: true });
      doc.text(`$${price.toFixed(2)}`, { width: 120, continued: true });
      doc.text(`$${productTotal.toFixed(2)}`, { align: 'right' }).moveDown();
    });

    // Total
    doc.fontSize(12).fillColor('#000000').text(`Total: $${totalValue.toFixed(2)}`, { align: 'right' }).moveDown();

    // Footer
    doc.fontSize(10).fillColor('#444444').text('Thank you for your business!', { align: 'center' });

    // Close the document
    doc.end();

    // Send success response
    return res.status(200).json({ message: 'Invoice generated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};