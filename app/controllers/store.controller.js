const db = require('../models');
const Store = db.store;

exports.createStore = async (req, res) => {
    try {
      const { ref, name, location } = req.body;
  
      // Create store
      const store = await Store.create({
        ref,
        name,
        location
      });
  
      res.status(201).json(store);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

exports.getAllStores = async (req, res) => {
  try {
    const stores = await Store.findAll();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      res.json(store);
    } else {
      res.status(404).json({ message: 'Store not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      await store.update(req.body);
      res.json(store);
    } else {
      res.status(404).json({ message: 'Store not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findByPk(req.params.id);
    if (store) {
      await store.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ message: 'Store not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};