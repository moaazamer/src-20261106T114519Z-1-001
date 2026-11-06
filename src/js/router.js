export default class AppRouter {
  constructor(app) {
    this.app = app;

    this.originalShowPage =
      app.productScanner.showPage.bind(app.productScanner);

    this.originalShowFoodLog = app.foodLog.show.bind(app.foodLog);
    this.originalOpenMeal = app.openMealDetails.bind(app);

    app.productScanner.showPage = (page) => {
      this.navigate(page === "products" ? "/products" : "/home");
    };

    app.foodLog.show = () => {
      this.navigate("/foodlog");
    };

    app.openMealDetails = (id) => {
      this.navigate(`/meal/${encodeURIComponent(id)}`);
    };

    document
      .getElementById("back-to-meals-btn")
      .addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.navigate("/home");
        },
        true
      );

    window.addEventListener("hashchange", () => {
      this.renderRoute();
    });

    if (!location.hash || location.hash === "#") {
      history.replaceState(null, "", "#/home");
    }

    this.renderRoute();
  }

  navigate(path) {
    const hash = `#${path}`;

    if (location.hash === hash) {
      this.renderRoute();
    } else {
      location.hash = path;
    }
  }

  async renderRoute() {
    const hash = location.hash;
    const path = hash.slice(1);

    if (path === "/home") {
      this.originalShowPage("meals");
      return;
    }

    if (path === "/products") {
      this.originalShowPage("products");
      return;
    }

    if (path === "/foodlog") {
      this.originalShowFoodLog();
      return;
    }

    const mealRoute = path.match(/^\/meal\/(\d+)$/);

    if (mealRoute) {
      this.originalShowPage("meals");
      await this.originalOpenMeal(mealRoute[1]);

      if (location.hash !== hash) {
        this.renderRoute();
      }

      return;
    }

    history.replaceState(null, "", "#/home");
    this.originalShowPage("meals");
  }
}