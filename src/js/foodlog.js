export default class FoodLog {
    constructor(app) {
        this.app = app;
        this.storageKey = "nutriplan-food-log";
        this.section = document.getElementById("foodlog-section");
        this.list = document.getElementById("logged-items-list");
        this.clearButton = document.getElementById("clear-foodlog");
        this.entries = [];
        this.storageReady = true;

        try {
            const saved = JSON.parse(localStorage.getItem(this.storageKey) ?? "[]");

            if (
                !Array.isArray(saved) ||
                !saved.every(
                    (entry) =>
                        entry &&
                        typeof entry.id === "string" &&
                        typeof entry.date === "string" &&
                        typeof entry.name === "string" &&
                        ["calories", "protein", "carbs", "fat"].every(
                            (key) =>
                                Number.isFinite(entry.nutrients?.[key]) &&
                                entry.nutrients[key] >= 0
                        )
                )
            ) {
                throw new Error("Invalid saved food log");
            }

            this.entries = saved;
        } catch (error) {
            this.storageReady = false;
            console.error(error);
            alert("Unable to read saved food log. Existing data was not changed.");
        }

        this.clearButton.addEventListener("click", () => {
            if (!confirm("Delete all entries for today?")) {
                return;
            }

            const entries = this.entries.filter(
                (entry) => entry.date !== this.dateKey()
            );

            this.save(entries);
        });

        const quickButtons = this.section.querySelectorAll(".quick-log-btn");

        quickButtons[0].addEventListener("click", () => {
            this.app.productScanner.showPage("meals");
        });

        quickButtons[1].addEventListener("click", () => {
            this.app.productScanner.showPage("products");
        });

        quickButtons[2].addEventListener("click", () => this.addCustomEntry());
    }

    dateKey(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    show() {
        this.app.videoFrame.removeAttribute("src");
        this.app.detailsSection.style.display = "none";

        this.app.homeSections.forEach((section) => {
            section.style.display = "none";
        });

        document.getElementById("products-section").style.display = "none";
        this.section.style.display = "";

        document.querySelector("#header h1").textContent = "Food Log";
        document.querySelector("#header p").textContent =
            "Track your daily food and nutrition";

        document.querySelectorAll("#sidebar .nav-link").forEach((link, index) => {
            const active = index === 2;

            link.classList.toggle("bg-emerald-50", active);
            link.classList.toggle("text-emerald-700", active);
            link.classList.toggle("text-gray-600", !active);
        });

        this.render();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    addProduct(product) {
        const keys = ["calories", "protein", "carbs", "fat"];

        const complete = keys.every((key) => {
            const value = product.nutrients?.[key];

            return (
                value !== null &&
                value !== undefined &&
                value !== "" &&
                Number.isFinite(Number(value)) &&
                Number(value) >= 0
            );
        });

        if (!complete) {
            alert("This product has incomplete nutrition data.");
            return;
        }

        const answer = prompt(
            `How many grams of ${product.name} did you eat?`,
            "100"
        );

        if (answer === null) {
            return;
        }

        const grams = Number(answer);

        if (!Number.isFinite(grams) || grams <= 0 || grams > 10000) {
            alert("Please enter a quantity greater than 0 and up to 10000 grams.");
            return;
        }

        const nutrients = {};

        keys.forEach((key) => {
            nutrients[key] = Number(product.nutrients[key]) * grams / 100;
        });

        const entry = {
            id: crypto.randomUUID(),
            date: this.dateKey(),
            name: product.name || "Unnamed product",
            quantity: `${grams} g`,
            nutrients,
        };

        if (this.save([...this.entries, entry])) {
            this.show();
        }
    }
    addMeal(meal, analysis) {
        const keys = ["calories", "protein", "carbs", "fat"];

        const valid = keys.every(
            (key) =>
                Number.isFinite(analysis?.perServing?.[key]) &&
                analysis.perServing[key] >= 0
        );

        if (!valid) {
            alert("Please analyze this meal before logging it.");
            return;
        }

        const answer = prompt(
            `How many servings of ${meal.name} did you eat?\nThe full recipe contains ${analysis.servings} servings.`,
            "1"
        );

        if (answer === null) {
            return;
        }

        const servings = Number(answer);

        if (
            !answer.trim() ||
            !Number.isFinite(servings) ||
            servings <= 0 ||
            servings > 100
        ) {
            alert("Please enter a serving count greater than 0 and up to 100.");
            return;
        }

        const nutrients = {};

        keys.forEach((key) => {
            nutrients[key] = analysis.perServing[key] * servings;
        });

        const entry = {
            id: crypto.randomUUID(),
            date: this.dateKey(),
            name: meal.name || "Unnamed meal",
            quantity: `${servings} serving${servings === 1 ? "" : "s"}`,
            nutrients,
        };

        if (this.save([...this.entries, entry])) {
            this.show();
        }
    }

    addCustomEntry() {
        const name = prompt("Food name:");

        if (!name?.trim()) {
            return;
        }

        const nutrients = {};

        for (const key of ["calories", "protein", "carbs", "fat"]) {
            const unit = key === "calories" ? "kcal" : "grams";
            const answer = prompt(
                `${key} in the portion you ate (${unit}):`
            );

            if (answer === null) {
                return;
            }

            const value = Number(answer);

            if (!answer.trim() || !Number.isFinite(value) || value < 0) {
                alert("Please enter a valid non-negative number.");
                return;
            }

            nutrients[key] = value;
        }

        const entry = {
            id: crypto.randomUUID(),
            date: this.dateKey(),
            name: name.trim(),
            quantity: "Custom portion",
            nutrients,
        };

        this.save([...this.entries, entry]);
    }

    save(entries) {
        if (!this.storageReady) {
            alert("Storage is unavailable. Your food log was not changed.");
            return false;
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(entries));
            this.entries = entries;
            this.render();
            return true;
        } catch (error) {
            console.error(error);
            alert("Could not save your changes. Please check browser storage.");
            return false;
        }
    }

    render() {
        const today = this.dateKey();
        const items = this.entries.filter((entry) => entry.date === today);

        document.getElementById("foodlog-date").textContent =
            new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
            });

        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
        };

        items.forEach((entry) => {
            Object.keys(totals).forEach((key) => {
                totals[key] += entry.nutrients[key];
            });
        });

        const goals = [
            ["calories", 2000, "kcal"],
            ["protein", 50, "g"],
            ["carbs", 250, "g"],
            ["fat", 65, "g"],
        ];

        const summary = document.getElementById("foodlog-today-section");
        const cards = summary.querySelector(".grid").children;

        goals.forEach(([key, goal, unit], index) => {
            const card = cards[index];
            const value = Math.round(totals[key] * 10) / 10;

            card.querySelectorAll("span")[1].textContent =
                `${value} / ${goal} ${unit}`;

            const progress = card.children[1].firstElementChild;

            progress.style.width = `${Math.min(value / goal * 100, 100)}%`;
            progress.style.backgroundColor = value > goal ? "#ef4444" : "";

            card.title = value > goal
                ? `${Math.round((value - goal) * 10) / 10} ${unit} above goal`
                : "";
        });

        summary.querySelector("h4").textContent =
            `Logged Items (${items.length})`;

        this.clearButton.style.display = items.length ? "" : "none";
        this.list.replaceChildren();

        if (items.length === 0) {
            const empty = document.createElement("p");

            empty.className = "text-center py-8 text-gray-500";
            empty.textContent = "No food logged today.";

            this.list.append(empty);
        }

        items.forEach((entry) => {
            const row = document.createElement("div");
            const info = document.createElement("div");
            const name = document.createElement("p");
            const details = document.createElement("p");
            const remove = document.createElement("button");

            row.className =
                "flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl";

            name.className = "font-semibold text-gray-900";
            name.textContent = entry.name;

            details.className = "text-sm text-gray-500";

            details.textContent =
                `${entry.quantity} · ${Math.round(entry.nutrients.calories)} kcal` +
                ` · Protein ${entry.nutrients.protein.toFixed(1)} g` +
                ` · Carbs ${entry.nutrients.carbs.toFixed(1)} g` +
                ` · Fat ${entry.nutrients.fat.toFixed(1)} g`;

            remove.type = "button";
            remove.className = "text-red-500 font-medium";
            remove.textContent = "Delete";
            remove.setAttribute("aria-label", `Delete ${entry.name}`);

            remove.addEventListener("click", () => {
                this.save(this.entries.filter((item) => item.id !== entry.id));
            });

            info.append(name, details);
            row.append(info, remove);
            this.list.append(row);
        });

        if (this.section.style.display !== "none") {
            this.renderWeeklyChart();
        }
    }

    renderWeeklyChart() {
        const dates = [];

        for (let offset = 6; offset >= 0; offset--) {
            const date = new Date();
            date.setDate(date.getDate() - offset);
            dates.push(this.dateKey(date));
        }

        const calories = dates.map((date) =>
            this.entries
                .filter((entry) => entry.date === date)
                .reduce((total, entry) => total + entry.nutrients.calories, 0)
        );

        const chart = document.getElementById("weekly-chart");

        if (!window.Plotly) {
            chart.textContent = "Weekly chart unavailable.";
            return;
        }

        if (!this.chartReady) {
            chart.replaceChildren();
            this.chartReady = true;
        }

        window.Plotly.react(
            chart,
            [{
                x: dates,
                y: calories,
                type: "bar",
                marker: { color: "#10b981" },
            }],
            {
                margin: { t: 20, r: 20, b: 50, l: 55 },
                height: 256,
                xaxis: { type: "category" },
                yaxis: { title: { text: "Calories (kcal)" } },
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
            },
            { responsive: true, displayModeBar: false }
        );
    }
}