export default class ProductScanner {
    constructor(app) {
        this.app = app;
        this.section = document.getElementById("products-section");
        this.grid = document.getElementById("products-grid");
        this.count = document.getElementById("products-count");
        this.searchInput = document.getElementById("product-search-input");
        this.barcodeInput = document.getElementById("barcode-input");
        this.template = this.grid.firstElementChild.cloneNode(true);
        this.products = [];
        this.controller = null;

        this.grid.replaceChildren();
        this.count.textContent = "Search by product name or barcode.";

        this.setupNavigation();
        this.setupEvents();
    }

    setupNavigation() {
        this.links = document.querySelectorAll("#sidebar .nav-link");

        this.links[0].addEventListener("click", (event) => {
            event.preventDefault();
            this.showPage("meals");
        });

        this.links[1].addEventListener("click", (event) => {
            event.preventDefault();
            this.showPage("products");
        });

        this.links[2].addEventListener("click", (event) => {
            event.preventDefault();
            this.app.foodLog.show();
        });
    }

    showPage(page) {
        const showProducts = page === "products";

        this.app.videoFrame.removeAttribute("src");
        this.app.detailsSection.style.display = "none";

        document.getElementById("foodlog-section").style.display = "none";

        this.app.homeSections.forEach((section) => {
            section.style.display = showProducts ? "none" : "";
        });

        this.section.style.display = showProducts ? "" : "none";

        document.querySelector("#header h1").textContent = showProducts
            ? "Product Scanner"
            : "Meals & Recipes";

        document.querySelector("#header p").textContent = showProducts
            ? "Search packaged products by name or barcode"
            : "Discover delicious and nutritious recipes tailored for you";

        this.links.forEach((link, index) => {
            const active = index === (showProducts ? 1 : 0);

            link.classList.toggle("bg-emerald-50", active);
            link.classList.toggle("text-emerald-700", active);
            link.classList.toggle("text-gray-600", !active);
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setupEvents() {
        document
            .getElementById("search-product-btn")
            .addEventListener("click", () => this.searchByName());

        document
            .getElementById("lookup-barcode-btn")
            .addEventListener("click", () => this.searchByBarcode());

        this.searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.searchByName();
            }
        });

        this.barcodeInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.searchByBarcode();
            }
        });

        document.querySelectorAll(".nutri-score-filter").forEach((button) => {
            button.addEventListener("click", () => {
                this.applyGrade(button.dataset.grade);
            });
        });

        document
            .querySelectorAll("#product-categories button")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    const category = button.textContent.trim().toLowerCase();

                    this.loadProducts(
                        `/products/category/${encodeURIComponent(category)}`
                    );
                });
            });
    }

    searchByName() {
        const query = this.searchInput.value.trim();

        if (!query) {
            this.searchInput.focus();
            return;
        }

        this.loadProducts(`/products/search?q=${encodeURIComponent(query)}`);
    }

    searchByBarcode() {
        const barcode = this.barcodeInput.value.trim();

        if (!/^\d{8,14}$/.test(barcode)) {
            alert("Please enter a barcode containing 8 to 14 digits.");
            this.barcodeInput.focus();
            return;
        }

        this.loadProducts(`/products/barcode/${barcode}`);
    }

    async loadProducts(path) {
        this.controller?.abort();

        const controller = new AbortController();
        this.controller = controller;
        this.products = [];

        this.grid.replaceChildren();
        this.count.textContent = "Loading products...";

        try {
            const response = await fetch(`${this.app.baseUrl}${path}`, {
                signal: controller.signal,
            });

            if (response.status === 404) {
                this.applyGrade("");
                return;
            }

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const data = await response.json();

            this.products = data.result ? [data.result] : data.results ?? [];
            this.applyGrade("");
        } catch (error) {
            if (error.name === "AbortError") {
                return;
            }

            this.count.textContent = "Unable to load products";
            this.grid.textContent =
                "Please check your connection and try again.";

            console.error(error);
        }
    }

    applyGrade(grade) {
        document.querySelectorAll(".nutri-score-filter").forEach((button) => {
            const selected = button.dataset.grade === grade;

            button.setAttribute("aria-pressed", String(selected));
            button.style.outline = selected ? "2px solid #059669" : "none";
            button.style.outlineOffset = "2px";
        });

        const products = grade
            ? this.products.filter(
                (product) =>
                    String(product.nutritionGrade).toLowerCase() === grade
            )
            : this.products;

        this.displayProducts(products);
    }

    displayProducts(products) {
        this.grid.replaceChildren();
        this.count.textContent = `Showing ${products.length} products`;

        if (products.length === 0) {
            this.grid.textContent = "No products found.";
            return;
        }

        const fragment = document.createDocumentFragment();

        products.forEach((product) => {
            const card = this.template.cloneNode(true);
            const image = card.querySelector("img");
            const imageContainer = card.firstElementChild;
            const body = card.lastElementChild;
            const nutrients = product.nutrients ?? {};

            card.dataset.barcode = product.barcode ?? "";
            card.style.cursor = "default";

            image.alt = product.name || "Unnamed product";

            if (product.image) {
                image.src = product.image;

                image.addEventListener("error", () => {
                    image.style.display = "none";
                });
            } else {
                image.removeAttribute("src");
                image.style.display = "none";
            }

            const gradeBadge = imageContainer.children[1];
            const novaBadge = imageContainer.children[2];
            const grade = String(product.nutritionGrade ?? "").toLowerCase();

            const gradeColors = {
                a: "#038141",
                b: "#85bb2f",
                c: "#c99b00",
                d: "#ee8100",
                e: "#e63e11",
            };

            gradeBadge.textContent = gradeColors[grade]
                ? `Nutri-Score ${grade.toUpperCase()}`
                : "Nutri-Score unavailable";

            gradeBadge.style.backgroundColor = gradeColors[grade] ?? "#6b7280";

            novaBadge.textContent = product.novaGroup ?? "";
            novaBadge.title = product.novaGroup
                ? `NOVA ${product.novaGroup}`
                : "";

            novaBadge.style.display = product.novaGroup ? "" : "none";

            body.querySelector("p").textContent = product.brand || "Unknown brand";
            body.querySelector("h3").textContent =
                product.name || "Unnamed product";

            const metadata = body.children[2].querySelectorAll("span");

            metadata[0].textContent = product.barcode ?? "";
            metadata[1].textContent =
                `${this.formatNutrient(nutrients.calories)} kcal/100g`;

            const values = body.children[3].querySelectorAll("div > p:first-child");
            const nutrientNames = ["protein", "carbs", "fat", "sugar"];

            nutrientNames.forEach((name, index) => {
                values[index].textContent =
                    `${this.formatNutrient(nutrients[name])} g`;
            });
            const logButton = document.createElement("button");

            logButton.type = "button";
            logButton.className =
                "mt-3 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold";

            logButton.textContent = "Log This Product";

            logButton.addEventListener("click", () => {
                this.app.foodLog.addProduct(product);
            });

            body.append(logButton);

            fragment.append(card);
        });

        this.grid.append(fragment);
    }

    formatNutrient(value) {
        if (value === null || value === undefined || value === "") {
            return "—";
        }

        const number = Number(value);

        return Number.isFinite(number)
            ? String(Math.round(number * 10) / 10)
            : "—";
    }
}