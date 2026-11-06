export default class Favorites {
    constructor(app) {
        this.app = app;
        this.storageKey = "nutriplan-favorites";
        this.meals = [];
        this.onlyFavorites = false;
        this.storageReady = true;

        try {
            const saved = JSON.parse(
                localStorage.getItem(this.storageKey) ?? "[]"
            );

            if (
                !Array.isArray(saved) ||
                !saved.every(
                    (meal) =>
                        meal &&
                        /^\d+$/.test(String(meal.id)) &&
                        typeof meal.name === "string"
                )
            ) {
                throw new Error("Invalid saved favorites");
            }

            this.meals = saved;
        } catch {
            this.storageReady = false;
            alert("Unable to read favorites. Saved data was not changed.");
        }

        this.button = document.createElement("button");
        this.button.type = "button";
        this.button.id = "favorites-toggle";
        this.button.className = "favorite-button";

        document.getElementById("view-toggle").before(this.button);

        this.button.addEventListener("click", () => {
            this.onlyFavorites = !this.onlyFavorites;

            this.app.displayMeals(
                this.onlyFavorites
                    ? this.meals
                    : this.app.currentMeals ?? []
            );

            this.update();
        });

        this.update();
    }

    update() {
        this.button.textContent = this.onlyFavorites
            ? "Show All Recipes"
            : `Favorites (${this.meals.length})`;

        this.button.setAttribute(
            "aria-pressed",
            String(this.onlyFavorites)
        );

        document.querySelector("#all-recipes-section h2").textContent =
            this.onlyFavorites ? "Favorite Recipes" : "All Recipes";
    }

    addButton(container, meal) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "favorite-button meal-favorite";

        const updateButton = () => {
            const saved = this.meals.some(
                (item) => String(item.id) === String(meal.id)
            );

            button.textContent = saved ? "♥ Saved" : "♡ Save Favorite";
            button.setAttribute("aria-pressed", String(saved));
            button.setAttribute(
                "aria-label",
                `${saved ? "Remove" : "Save"} ${meal.name} ${saved ? "from" : "to"
                } favorites`
            );
        };

        updateButton();

        button.addEventListener("click", (event) => {
            event.stopPropagation();

            if (!this.storageReady) {
                alert("Favorites storage is unavailable.");
                return;
            }

            const saved = this.meals.some(
                (item) => String(item.id) === String(meal.id)
            );

            const next = saved
                ? this.meals.filter(
                    (item) => String(item.id) !== String(meal.id)
                )
                : [...this.meals, meal];

            try {
                localStorage.setItem(
                    this.storageKey,
                    JSON.stringify(next)
                );

                this.meals = next;
                updateButton();
                this.update();

                if (this.onlyFavorites) {
                    this.app.displayMeals(this.meals);
                }
            } catch {
                alert("Could not save favorites. Check browser storage.");
            }
        });

        container.append(button);
    }
}