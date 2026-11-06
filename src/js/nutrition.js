export default class MealNutrition {
    constructor(app) {
        this.app = app;
        this.apiKey = "";
        this.cache = new Map();
        this.container = document.getElementById("nutrition-facts-container");
        this.logButton = document.getElementById("log-meal-btn");
    }

    show(meal) {
        this.controller?.abort();
        this.controller = null;
        this.meal = meal;
        this.analysis = null;
        this.container.replaceChildren();

        this.logButton.disabled = true;
        this.logButton.style.opacity = "0.5";
        this.logButton.title = "Analyze this meal before logging it.";
        this.logButton.onclick = null;

        const form = document.createElement("form");
        const label = document.createElement("label");
        const input = document.createElement("input");
        const button = document.createElement("button");
        const status = document.createElement("p");
        const results = document.createElement("div");

        form.className = "space-y-3";
        label.className = "block text-sm font-medium";
        label.textContent = "USDA API key";
        label.htmlFor = "usda-api-key";

        input.id = "usda-api-key";
        input.type = "password";
        input.autocomplete = "off";
        input.required = true;
        input.placeholder = "Paste your USDA API key";
        input.value = this.apiKey;
        input.className = "w-full p-3 border rounded-xl";

        button.type = "submit";
        button.textContent = "Analyze Nutrition";
        button.className =
            "px-4 py-2 bg-emerald-600 text-white rounded-xl";

        status.className = "text-sm text-gray-500";
        status.setAttribute("role", "status");
        results.className = "space-y-3";

        form.append(label, input, button);
        this.container.append(form, status, results);

        this.status = status;
        this.results = results;

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const key = input.value.trim();

            if (!key) {
                input.focus();
                return;
            }

            this.apiKey = key;
            this.analyze(meal, key, button, status);
        });

        const cached = this.cache.get(String(meal.id));

        if (cached) {
            this.renderAnalysis(meal, cached);
        } else {
            status.textContent =
                "Enter your key and analyze the recipe to enable food logging.";
        }
    }

    async analyze(meal, key, button, status) {
        this.controller?.abort();

        const controller = new AbortController();
        this.controller = controller;

        button.disabled = true;
        button.textContent = "Analyzing...";
        status.textContent = "Calculating nutrition from the recipe ingredients...";

        this.analysis = null;
        this.results.replaceChildren();
        this.logButton.disabled = true;
        this.logButton.style.opacity = "0.5";
        this.logButton.onclick = null;

        const timeout = setTimeout(() => controller.abort(), 60000);

        try {
            const ingredients = (meal.ingredients ?? [])
                .filter((item) => String(item.ingredient ?? "").trim())
                .map((item) =>
                    `${item.measure ?? ""} ${item.ingredient}`.trim()
                );

            if (!ingredients.length) {
                throw new Error("This meal has no ingredients to analyze.");
            }

            const response = await fetch(
                `${this.app.baseUrl}/nutrition/analyze`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": key,
                    },
                    body: JSON.stringify({
                        recipeName: meal.name,
                        ingredients,
                    }),
                    signal: controller.signal,
                }
            );

            const payload = await response.json().catch(() => null);

            if (response.status === 401 || response.status === 403) {
                throw new Error("Please check your USDA API key and try again.");
            }

            if (response.status === 429) {
                throw new Error("Request limit reached. Please try again later.");
            }

            if (!response.ok || payload?.success !== true) {
                const message =
                    payload?.error?.message ||
                    payload?.message ||
                    `Nutrition analysis failed (${response.status}).`;

                const ingredient = payload?.error?.ingredient;

                throw new Error(
                    ingredient ? `${message} Ingredient: ${ingredient}` : message
                );
            }

            const data = payload.data;
            const keys = ["calories", "protein", "carbs", "fat"];

            const valid =
                Number.isFinite(data?.servings) &&
                data.servings > 0 &&
                keys.every(
                    (name) =>
                        Number.isFinite(data?.perServing?.[name]) &&
                        data.perServing[name] >= 0
                );

            if (!valid) {
                throw new Error("The API returned incomplete nutrition data.");
            }

            if (this.controller !== controller) {
                return;
            }

            this.cache.set(String(meal.id), data);
            this.renderAnalysis(meal, data);
        } catch (error) {
            if (this.controller !== controller) {
                return;
            }

            status.textContent =
                error.name === "AbortError"
                    ? "Analysis timed out. Please try again."
                    : error.message;
        } finally {
            clearTimeout(timeout);
            button.disabled = false;
            button.textContent = "Analyze Nutrition";
        }
    }

    renderAnalysis(meal, data) {
        this.analysis = data;
        this.results.replaceChildren();
        this.status.textContent =
            `Estimated nutrition per serving. Recipe: ${data.servings} servings.`;

        const nutrients = [
            ["calories", "Calories", "kcal"],
            ["protein", "Protein", "g"],
            ["carbs", "Carbohydrates", "g"],
            ["fat", "Fat", "g"],
            ["fiber", "Fiber", "g"],
            ["sugar", "Sugar", "g"],
            ["saturatedFat", "Saturated fat", "g"],
            ["cholesterol", "Cholesterol", "mg"],
            ["sodium", "Sodium", "mg"],
        ];

        nutrients.forEach(([key, name, unit]) => {
            const row = document.createElement("div");
            const label = document.createElement("span");
            const value = document.createElement("span");
            const amount = data.perServing[key];

            row.className =
                "flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl";
            label.textContent = name;
            value.className = "font-semibold";
            value.textContent = Number.isFinite(amount)
                ? `${Math.round(amount * 10) / 10} ${unit}`
                : "Unavailable";

            row.append(label, value);
            this.results.append(row);
        });

        this.logButton.disabled = false;
        this.logButton.style.opacity = "1";
        this.logButton.title = "Log the servings you ate";
        this.logButton.onclick = () => {
            this.app.foodLog.addMeal(meal, data);
        };
    }
}