/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
*  No part of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: Roman Telets
*  Student ID: 162741227
*  Date: 2024/11/17
*  Vercel Web App URL: N/A
*  GitHub Repository URL: https://github.com/OddWumpus/WEB322-A4/
********************************************************************************/

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const stripJs = require('strip-js');
const storeService = require('./store-service.js');

// App Configuration
const app = express();
const PORT = process.env.PORT || 8080;

// Handlebars Configuration
const configureHandlebars = () => {
  const helpers = {
    navLink: (url, options) => (
      `<li class="nav-item">
        <a class="nav-link${url == app.locals.activeRoute ? " active" : ""}" href="${url}">
          ${options.fn(this)}
        </a>
      </li>`
    ),
    equal: (lvalue, rvalue, options) => {
      if (arguments.length < 3) {
        throw new Error("Handlebars Helper 'equal' needs 2 parameters");
      }
      return lvalue === rvalue ? options.fn(this) : options.inverse(this);
    },
    safeHTML: (context) => stripJs(context)
  };

  app.engine('.hbs', exphbs.engine({ extname: '.hbs', helpers }));
  app.set('view engine', '.hbs');
};

// Middleware Setup
const setupMiddleware = () => {
  app.use(express.static('public'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(setActiveRoute);
};

// Route Handler Middleware
const setActiveRoute = (req, res, next) => {
  const route = req.path.substring(1);
  app.locals.activeRoute = '/' + (
    isNaN(route.split('/')[1]) 
      ? route.replace(/\/(?!.*)/, '') 
      : route.replace(/\/(.*)/, '')
  );
  app.locals.viewingCategory = req.query.category;
  next();
};

// Image Upload Handler
const handleImageUpload = async (file) => {
  if (!file) return '';
  
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (result) resolve(result.url);
      else reject(error);
    });
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// Route Handlers
const routeHandlers = {
  about: (req, res) => res.render('about'),

  shop: async (req, res) => {
    try {
      const category = req.query.category;
      const [items, categories] = await Promise.all([
        storeService.getPublishedItemsByCategory(category),
        storeService.getAllCategories()
      ]);
      
      res.render('shop', {
        data: {
          items,
          categories,
          message: 'Items in the selected category',
          viewingCategory: category
        }
      });
    } catch (error) {
      res.render('shop', { data: { message: `Error: ${error.message}` } });
    }
  },

  categories: async (req, res) => {
    try {
      const categories = await storeService.getAllCategories();
      res.render('categories', {
        categories,
        message: categories.length ? null : 'No categories available.'
      });
    } catch (error) {
      res.render('categories', {
        categories: [],
        message: 'Unable to fetch categories at this time.'
      });
    }
  },

  items: async (req, res) => {
    try {
      const category = req.query.category;
      const items = category 
        ? await storeService.getItemsByCategory(category)
        : await storeService.getAllItems();
      res.render('items', { items });
    } catch (error) {
      res.render('items', { message: 'no results' });
    }
  },

  addItemForm: (req, res) => res.render('addItem'),

  addItem: async (req, res) => {
    try {
      const imageUrl = await handleImageUpload(req.file);
      await storeService.addItem({ ...req.body, featureImage: imageUrl });
      res.redirect('/shop');
    } catch (error) {
      res.status(500).send('Error adding item');
    }
  },

  getItemById: async (req, res) => {
    try {
      const item = await storeService.getItemById(req.params.id);
      if (!item) {
        return res.status(404).render('404', { message: 'Item not found' });
      }
      res.render('shop', {
        item,
        items: await storeService.getPublishedItems(),
        categories: await storeService.getCategories(),
        message: '',
        categoriesMessage: ''
      });
    } catch (error) {
      res.status(500).render('404', { message: 'Error retrieving item' });
    }
  }
};

// Route Setup
const setupRoutes = () => {
  app.get('/about', routeHandlers.about);
  app.get('/shop', routeHandlers.shop);
  app.get('/categories', routeHandlers.categories);
  app.get('/items', routeHandlers.items);
  app.get('/items/add', routeHandlers.addItemForm);
  app.post('/items/add', multer().single('featureImage'), routeHandlers.addItem);
  app.get('/shop/:id', routeHandlers.getItemById);
  
  // 404 Handler
  app.use((req, res) => {
    res.status(404).render('404', {
      message: 'The page you are looking for does not exist.'
    });
  });
};

// Server Initialization
const initializeServer = async () => {
  try {
    await storeService.initialize();
    console.log('Server initialized');
    
    configureHandlebars();
    setupMiddleware();
    setupRoutes();
    
    app.listen(PORT, () => {
      console.log(`Express http server listening on port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

initializeServer();

module.exports = app;
