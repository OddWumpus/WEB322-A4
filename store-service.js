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

const fs = require('fs').promises;

let items = [];
let categories = [];

const readJsonFile = async (path) => {
    try {
        const data = await fs.readFile(path, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        throw new Error(`Unable to read the file at ${path}`);
    }
};

exports.initialize = async () => {
    try {
        items = await readJsonFile('./data/items.json');
        categories = await readJsonFile('./data/categories.json');
    } catch (err) {
        throw err;
    }
};

exports.getPublishedItems = async () => {
    const publishedItems = items.filter(item => item.published);
    if (publishedItems.length === 0) {
        throw new Error('No published items found');
    }
    return publishedItems;
};

exports.getAllCategories = async () => {
    if (categories.length === 0) {
        throw new Error('No categories available');
    }
    return categories;
};

exports.getAllItems = async () => {
    if (items.length === 0) {
        throw new Error('No items available');
    }
    return items;
};

exports.getItemsByCategory = async (category) => {
    const filteredItems = items.filter(item => item.category === category);
    if (filteredItems.length === 0) {
        throw new Error('No items found for this category');
    }
    return filteredItems;
};

exports.getItemsByMinDate = async (minDateStr) => {
    const minDate = new Date(minDateStr);
    const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
    if (filteredItems.length === 0) {
        throw new Error('No items found after the given date');
    }
    return filteredItems;
};

exports.getItemById = async (id) => {
    const item = items.find(item => item.id == id);
    if (!item) {
        throw new Error('Item not found');
    }
    return item;
};

exports.getPublishedItemsByCategory = async (category) => {
    const publishedItems = items.filter(item => item.published && item.category === category);
    if (publishedItems.length === 0) {
        throw new Error('No published items found for this category');
    }
    return publishedItems;
};

exports.addItem = async (itemData) => {
    const currentDate = new Date().toISOString().split('T')[0];
    itemData.itemDate = currentDate;
    itemData.id = items.length + 1;
    items.push(itemData);

    try {
        await fs.writeFile('./data/items.json', JSON.stringify(items, null, 2));
    } catch (err) {
        throw new Error('Unable to save the item');
    }
};