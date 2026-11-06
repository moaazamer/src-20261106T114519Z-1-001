# NutriPlan - JavaScript Starter Project

Welcome to the NutriPlan starter project! The design is fully complete - your task is to bring it to life with JavaScript.

## 🎯 Project Overview

NutriPlan is a Food, Nutrition & Fitness Planner web application. The HTML and CSS are ready - you need to implement the JavaScript functionality.

## 📁 Project Structure

```
starter/
├── index.html          # Main HTML file (ready)
├── README.md           # This file
└── src/
    ├── css/
    │   └── style.css   # Styles (ready)
    └── js/
        ├── main.js           # Entry point (implement here)
        ├── api/
        │   └── mealdb.js     # API module (implement here)
        ├── state/
        │   └── appState.js   # State management (implement here)
        └── ui/
            └── components.js  # UI components (implement here)
```

## 🚀 Getting Started

1. Open `index.html` in your browser to see the design
2. Start implementing the JavaScript files
3. Begin with `src/js/api/mealdb.js` - fetch data from the API
4. Then update `src/js/main.js` to load and display data

## 🔗 API Reference

### TheMealDB API (Free, No API Key Required)

Base URL: `https://www.themealdb.com/api/json/v1/1/`

| Endpoint | Description | Example |
|----------|-------------|---------|
| `/categories.php` | Get all categories | [Try it](https://www.themealdb.com/api/json/v1/1/categories.php) |
| `/search.php?s={query}` | Search meals by name | [Try it](https://www.themealdb.com/api/json/v1/1/search.php?s=chicken) |
| `/lookup.php?i={id}` | Get meal by ID | [Try it](https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772) |
| `/filter.php?c={category}` | Filter by category | [Try it](https://www.themealdb.com/api/json/v1/1/filter.php?c=Seafood) |
| `/filter.php?a={area}` | Filter by area/cuisine | [Try it](https://www.themealdb.com/api/json/v1/1/filter.php?a=Italian) |
| `/random.php` | Get random meal | [Try it](https://www.themealdb.com/api/json/v1/1/random.php) |

## ✅ Tasks to Complete

### Level 1: Basic Functionality
- [ ] Fetch and display meal categories in `#categories-grid`
- [ ] Fetch and display recipes in `#recipes-grid`
- [ ] Hide the loading overlay when data is loaded
- [ ] Update the recipe count text

### Level 2: Interactivity
- [ ] Implement search functionality (use `#search-input`)
- [ ] Filter recipes when clicking on a category
- [ ] Show meal details when clicking on a recipe card

### Level 3: Navigation
- [ ] Implement sidebar navigation between pages
- [ ] Create different views (Meals, Products, Food Log)

### Level 4: Advanced Features
- [ ] Add loading states while fetching data
- [ ] Implement error handling for API calls
- [ ] Save favorites to localStorage

## 🎨 Key HTML Elements

### Meals Page
| Element ID | Purpose |
|------------|---------|
| `#app-loading-overlay` | Loading screen (hide when ready) |
| `#categories-grid` | Container for category cards |
| `#recipes-grid` | Container for recipe cards |
| `#search-input` | Search input field |
| `#recipes-count` | Text showing recipe count |

### Product Scanner Page
| Element ID | Purpose |
|------------|---------|
| `#products-section` | Product scanner page container (toggle display) |
| `#product-search-input` | Product name search input |
| `#barcode-input` | Barcode number input |
| `#search-product-btn` | Product search button |
| `#lookup-barcode-btn` | Barcode lookup button |
| `#products-grid` | Container for product cards |
| `#products-count` | Text showing products count |
| `.nutri-score-filter` | Nutri-Score filter buttons |

### Food Log Page
| Element ID | Purpose |
|------------|---------|
| `#foodlog-section` | Food log page container (toggle display) |
| `#foodlog-date` | Current date display |
| `#foodlog-today-section` | Today's nutrition summary |
| `#logged-items-list` | Container for logged food items |
| `#weekly-chart` | Weekly chart container (Plotly) |
| `#clear-foodlog` | Clear all logged items button |
| `.quick-log-btn` | Quick action buttons |

## 💡 Tips

1. **Start Simple**: First just fetch and log data to console
2. **Use Modules**: The project uses ES6 modules (`type="module"`)
3. **Check Console**: Look for TODO messages and errors
4. **Inspect Design**: The skeleton loaders show the expected card layout
5. **Navigation**: Use `style.display = "none"` or `style.display = ""` to show/hide sections
6. **Page State**: Track current page in your app state for navigation

## 🔄 Navigation

To switch between pages, hide/show the relevant sections:
- **Meals Page**: Show `#search-filters-section`, `#meal-categories-section`, `#all-recipes-section`
- **Product Scanner**: Show `#products-section`
- **Food Log**: Show `#foodlog-section`
## Running the Project

Open index.html using VS Code Live Server.

## Implemented Features

- Meal search and filtering by category or cuisine.
- Meal details, ingredients, instructions and video.
- Grid and list views.
- Favorites saved in LocalStorage.
- Product search by name or barcode.
- Recipe nutrition analysis using a USDA API key.
- Food logging for meal servings and product quantities.
- Daily nutrition totals and a weekly calorie chart.
- Delete individual entries or clear today's log.
- Hash-based navigation and a mobile sidebar.

## Nutrition Analysis

Open a meal and enter your own USDA API key in Nutrition Facts.
Click Analyze Nutrition, then Log This Meal after analysis succeeds.

The key is kept only in page memory and must be entered again after refresh.
It is sent to the NutriPlan API for analysis and is not saved in LocalStorage.

Meal quantities are entered as servings.
Product quantities are entered in grams.

## Saved Data

Food logs and favorites are stored in the current browser using LocalStorage.
They are not synced between devices or different website addresses.
