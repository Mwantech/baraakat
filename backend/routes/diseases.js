// routes/diseases.js - Disease information API
const express = require('express');
const router = express.Router();
const { Disease, DiseaseCategory } = require('../models/Disease');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Get all disease categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await DiseaseCategory.find()
      .sort({ name: 1 });
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all diseases (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { symptoms: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get diseases with pagination
    const diseases = await Disease.find(filter)
      .populate('category', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Disease.countDocuments(filter);
    
    res.json({
      diseases,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get disease by ID
router.get('/:id', async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id)
      .populate('category', 'name');
    
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }
    
    res.json(disease);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new disease (admin only)
router.post('/', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { name, description, symptoms, causes, treatments, preventions, category } = req.body;
    
    // Validate required fields
    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }
    
    // Check if disease with same name exists
    const existingDisease = await Disease.findOne({ name: name.trim() });
    if (existingDisease) {
      return res.status(400).json({ message: 'A disease with this name already exists' });
    }
    
    // Check if category exists
    const categoryExists = await DiseaseCategory.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Disease category not found' });
    }
    
    // Create new disease
    const newDisease = new Disease({
      name,
      description,
      symptoms: symptoms || [],
      causes: causes || [],
      treatments: treatments || [],
      preventions: preventions || [],
      category
    });
    
    await newDisease.save();
    
    res.status(201).json(newDisease);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update disease (admin only)
router.put('/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { name, description, symptoms, causes, treatments, preventions, category } = req.body;
    
    // Check if disease exists
    const disease = await Disease.findById(req.params.id);
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }
    
    // Check for duplicate name if name is being changed
    if (name && name !== disease.name) {
      const existingDisease = await Disease.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existingDisease) {
        return res.status(400).json({ message: 'A disease with this name already exists' });
      }
    }
    
    // Check if category exists if it's being updated
    if (category && category !== disease.category.toString()) {
      const categoryExists = await DiseaseCategory.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ message: 'Disease category not found' });
      }
    }
    
    // Update disease
    if (name) disease.name = name;
    if (description) disease.description = description;
    if (symptoms) disease.symptoms = symptoms;
    if (causes) disease.causes = causes;
    if (treatments) disease.treatments = treatments;
    if (preventions) disease.preventions = preventions;
    if (category) disease.category = category;
    
    await disease.save();
    
    res.json(disease);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete disease (admin only)
router.delete('/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const disease = await Disease.findById(req.params.id);
    
    if (!disease) {
      return res.status(404).json({ message: 'Disease not found' });
    }
    
    await disease.remove();
    
    res.json({ message: 'Disease deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new disease category (admin only)
router.post('/categories', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Check for duplicate
    const existingCategory = await DiseaseCategory.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    
    const newCategory = new DiseaseCategory({
      name,
      description: description || ''
    });
    
    await newCategory.save();
    
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a disease category (admin only)
router.put('/categories/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const category = await DiseaseCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check for duplicate name if name is being changed
    if (name && name !== category.name) {
      const existingCategory = await DiseaseCategory.findOne({ 
        name: name.trim(), 
        _id: { $ne: req.params.id } 
      });
      
      if (existingCategory) {
        return res.status(400).json({ message: 'A category with this name already exists' });
      }
    }
    
    // Update category
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    
    await category.save();
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a disease category (admin only)
router.delete('/categories/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const category = await DiseaseCategory.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if any diseases are using this category
    const diseasesUsingCategory = await Disease.countDocuments({ category: req.params.id });
    
    if (diseasesUsingCategory > 0) {
      return res.status(400).json({
        message: 'Cannot delete category that is in use',
        diseasesCount: diseasesUsingCategory
      });
    }
    
    await category.remove();
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;