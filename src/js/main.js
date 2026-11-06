/**
 * NutriPlan - Main Entry Point
 * 
 * This is the main entry point for the application.
 * Import your modules and initialize the app here.
 */

import AppRouter from "./router.js";
import FoodLog from "./foodlog.js";
import ProductScanner from "./products.js";
import MealNutrition from "./nutrition.js";
import Favorites from "./favorites.js";



class MealsApp {
    constructor() {
        this.baseUrl = "https://nutriplan-api.vercel.app/api";
        this.recipesGrid = document.getElementById("recipes-grid");
        this.recipesCount = document.getElementById("recipes-count");
        this.loadingOverlay = document.getElementById("app-loading-overlay");
        this.cardTemplate = this.recipesGrid
            .querySelector(".recipe-card")
            .cloneNode(true);
        this.searchInput = document.getElementById("search-input");

        this.searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.loadMeals(this.searchInput.value.trim());
            }
        });
        this.favorites = new Favorites(this);
        this.setupMealDetails();
        this.productScanner = new ProductScanner(this);
        this.foodLog = new FoodLog(this);
        this.nutrition = new MealNutrition(this);
        this.init();
    }

    async init() {
        const sidebar = document.getElementById("sidebar");
        const sidebarOverlay = document.getElementById("sidebar-overlay");
        const menuButton = document.getElementById("header-menu-btn");
        const closeButton = document.getElementById("sidebar-close-btn");
        const mobileScreen = window.matchMedia("(max-width: 1024px)");

        const closeMenu = () => {
            sidebar.classList.remove("open");
            sidebarOverlay.classList.remove("active");
            menuButton.setAttribute("aria-expanded", "false");
        };

        menuButton.setAttribute("aria-controls", "sidebar");
        menuButton.setAttribute("aria-expanded", "false");

        menuButton.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("open");

            sidebarOverlay.classList.toggle("active", isOpen);
            menuButton.setAttribute("aria-expanded", String(isOpen));

            if (isOpen) {
                closeButton.focus();
            }
        });

        closeButton.addEventListener("click", () => {
            closeMenu();
            menuButton.focus();
        });

        sidebarOverlay.addEventListener("click", closeMenu);

        sidebar.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && sidebar.classList.contains("open")) {
                closeMenu();
                menuButton.focus();
            }
        });

        mobileScreen.addEventListener("change", closeMenu);
        document.getElementById("meal-details").style.display = "none";
        document.getElementById("products-section").style.display = "none";
        document.getElementById("foodlog-section").style.display = "none";
        const viewToggle = document.getElementById("view-toggle");
        const gridButton = document.getElementById("grid-view-btn");
        const listButton = document.getElementById("list-view-btn");

        viewToggle.style.display = "";

        const changeView = (view) => {
            const isList = view === "list";

            this.recipesGrid.classList.toggle("recipes-list-view", isList);

            gridButton.setAttribute("aria-pressed", String(!isList));
            listButton.setAttribute("aria-pressed", String(isList));

            gridButton.classList.toggle("view-active", !isList);
            listButton.classList.toggle("view-active", isList);
        };

        gridButton.classList.remove("bg-white", "shadow-sm");

        gridButton.addEventListener("click", () => changeView("grid"));
        listButton.addEventListener("click", () => changeView("list"));

        changeView("grid");
        await this.loadMeals();
        await this.loadFilters();
        this.router = new AppRouter(this);
    }


    async loadFilters() {
        const categoriesGrid = document.getElementById("categories-grid");
        const categoryTemplate = categoriesGrid
            .querySelector(".category-card")
            .cloneNode(true);

        const areasContainer = document.querySelector(
            "#search-filters-section .overflow-x-auto"
        );

        this.searchInput.placeholder = "Search recipes by name...";

        try {
            const responses = await Promise.all([
                fetch(`${this.baseUrl}/meals/categories`),
                fetch(`${this.baseUrl}/meals/areas`),
            ]);

            if (responses.some((response) => !response.ok)) {
                throw new Error("Unable to load filters");
            }

            const [categoriesData, areasData] = await Promise.all(
                responses.map((response) => response.json())
            );

            categoriesGrid.replaceChildren();
            areasContainer.replaceChildren();

            const allButton = document.createElement("button");

            allButton.type = "button";
            allButton.textContent = "All Recipes";
            allButton.className =
                "px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap";

            allButton.addEventListener("click", () => {
                this.searchInput.value = "";
                this.loadMeals();
            });

            areasContainer.append(allButton);

            categoriesData.results.forEach((category) => {
                const card = categoryTemplate.cloneNode(true);

                card.dataset.category = category.name;
                card.querySelector("h3").textContent = category.name;
                card.tabIndex = 0;
                card.setAttribute("role", "button");

                const selectCategory = () => {
                    this.searchInput.value = "";
                    this.loadMeals("", { category: category.name });
                };

                card.addEventListener("click", selectCategory);

                card.addEventListener("keydown", (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectCategory();
                    }
                });

                categoriesGrid.append(card);
            });

            areasData.results.forEach((area) => {
                const button = document.createElement("button");

                button.type = "button";
                button.textContent = area.name;
                button.className =
                    "px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all";

                button.addEventListener("click", () => {
                    this.searchInput.value = "";
                    this.loadMeals("", { area: area.name });
                });

                areasContainer.append(button);
            });

            const viewAllButton = document.querySelector(
                "#meal-categories-section button"
            );

            viewAllButton.addEventListener("click", () => {
                this.searchInput.value = "";
                this.loadMeals();
            });
        } catch (error) {
            categoriesGrid.textContent =
                "Unable to load filters. Please refresh the page.";

            console.error(error);
        }
    }
    async loadMeals(query = "", filters = {}) {
        this.loadingOverlay.style.display = "flex";
        this.recipesGrid.replaceChildren();
        this.recipesCount.textContent = "Loading recipes...";

        try {
            const params = new URLSearchParams();
            let endpoint = "search";

            if (filters.category) {
                endpoint = "filter";
                params.set("category", filters.category);
            } else if (filters.area) {
                endpoint = "filter";
                params.set("area", filters.area);
            } else {
                params.set("q", query);
            }

            const response = await fetch(
                `${this.baseUrl}/meals/${endpoint}?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const data = await response.json();
            const meals = (data.results ?? []).slice(0, 25);

            this.currentMeals = meals;
            this.favorites.onlyFavorites = false;
            this.favorites.update();
            this.displayMeals(meals);
        } catch (error) {
            this.recipesCount.textContent = "Unable to load recipes";
            this.recipesGrid.textContent =
                "Please check your connection and refresh the page.";

            console.error(error);
        } finally {
            this.loadingOverlay.style.display = "none";
        }
    }
    setupMealDetails() {
        this.detailsSection = document.getElementById("meal-details");

        this.homeSections = [
            document.getElementById("search-filters-section"),
            document.getElementById("meal-categories-section"),
            document.getElementById("all-recipes-section"),
        ];

        const headings = this.detailsSection.querySelectorAll("h2");

        this.ingredientsHeading = headings[0];
        this.ingredientsList = headings[0].nextElementSibling;
        this.instructionsList = headings[1].nextElementSibling;

        this.ingredientTemplate =
            this.ingredientsList.firstElementChild.cloneNode(true);

        this.instructionTemplate =
            this.instructionsList.firstElementChild.cloneNode(true);

        this.videoFrame = this.detailsSection.querySelector("iframe");
        this.videoContainer = this.videoFrame.parentElement;
        this.videoFrame.removeAttribute("src");

        this.recipesGrid.addEventListener("click", (event) => {
            const card = event.target.closest(".recipe-card");

            if (card) {
                this.openMealDetails(card.dataset.mealId);
            }
        });

        document
            .getElementById("back-to-meals-btn")
            .addEventListener("click", () => {
                this.videoFrame.removeAttribute("src");
                this.detailsSection.style.display = "none";

                this.homeSections.forEach((section) => {
                    section.style.display = "";
                });

                document
                    .getElementById("all-recipes-section")
                    .scrollIntoView({ behavior: "smooth" });
            });
    }

    async openMealDetails(id) {
        this.loadingOverlay.style.display = "flex";

        try {
            const response = await fetch(
                `${this.baseUrl}/meals/${encodeURIComponent(id)}`
            );

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const data = await response.json();

            if (!data.result) {
                throw new Error("Meal not found");
            }

            this.currentMeal = data.result;
            this.renderMealDetails(this.currentMeal);

            this.homeSections.forEach((section) => {
                section.style.display = "none";
            });

            this.detailsSection.style.display = "";
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            console.error(error);
            alert("Unable to load meal details. Please try again.");
        } finally {
            this.loadingOverlay.style.display = "none";
        }
    }

    renderMealDetails(meal) {
        const image = this.detailsSection.querySelector("img");
        const title = this.detailsSection.querySelector("h1");
        const badges = title.previousElementSibling.querySelectorAll("span");

        image.src = meal.thumbnail;
        image.alt = meal.name;
        title.textContent = meal.name;

        badges[0].textContent = meal.category;
        badges[1].textContent = meal.area;
        badges[2].style.display = "none";

        title.nextElementSibling.style.display = "none";

        const ingredients = meal.ingredients ?? [];

        this.ingredientsHeading.querySelector("span").textContent =
            `${ingredients.length} items`;

        this.ingredientsList.replaceChildren();

        ingredients.forEach((item) => {
            const row = this.ingredientTemplate.cloneNode(true);
            const checkbox = row.querySelector("input");
            const label = row.querySelector("span");

            checkbox.checked = false;
            checkbox.setAttribute("aria-label", item.ingredient);
            label.textContent = `${item.measure} ${item.ingredient}`.trim();

            this.ingredientsList.append(row);
        });

        this.instructionsList.replaceChildren();

        const steps = Array.isArray(meal.instructions)
            ? meal.instructions
            : String(meal.instructions ?? "")
                .split(/\r?\n/)
                .filter((step) => step.trim());

        steps.forEach((step, index) => {
            const row = this.instructionTemplate.cloneNode(true);

            row.firstElementChild.textContent = index + 1;
            row.querySelector("p").textContent = step;

            this.instructionsList.append(row);
        });

        this.videoFrame.removeAttribute("src");
        this.videoContainer.replaceChildren(this.videoFrame);

        let videoId = "";

        try {
            const url = new URL(meal.youtube);

            if (url.hostname === "youtu.be") {
                videoId = url.pathname.slice(1);
            } else if (
                url.hostname === "youtube.com" ||
                url.hostname.endsWith(".youtube.com")
            ) {
                videoId = url.searchParams.get("v") ?? "";
            }
        } catch {
            videoId = "";
        }

        if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            this.videoFrame.style.display = "";
            this.videoFrame.src = `https://www.youtube.com/embed/${videoId}`;
            this.videoFrame.title = `${meal.name} video tutorial`;
        } else {
            this.videoFrame.style.display = "none";

            const message = document.createElement("p");

            message.className = "p-6 text-gray-500";
            message.textContent = "No video available for this meal.";

            this.videoContainer.append(message);
        }

        this.nutrition.show(meal);
    }

    displayMeals(meals) {
        const fragment = document.createDocumentFragment();

        meals.forEach((meal) => {
            const card = this.cardTemplate.cloneNode(true);
            const image = card.querySelector("img");
            const labels = card.querySelectorAll("span");

            card.dataset.mealId = meal.id;

            image.src = meal.thumbnail;
            image.alt = meal.name;

            card.querySelector("h3").textContent = meal.name;
            card.querySelector("p").textContent =
                `${meal.category} recipe from ${meal.area}.`;

            labels[0].textContent = meal.category;
            labels[1].textContent = meal.area;

            labels[2].lastChild.textContent = ` ${meal.category}`;
            labels[3].lastChild.textContent = ` ${meal.area}`;
            this.favorites.addButton(card.lastElementChild, meal),
            fragment.append(card);
        });

        this.recipesGrid.replaceChildren(fragment);
        this.recipesCount.textContent = `Showing ${meals.length} recipes`;

        if (meals.length === 0) {
            this.recipesGrid.textContent = "No recipes found.";
        }
    }
}

new MealsApp();


