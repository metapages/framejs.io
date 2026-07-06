import DefaultTheme from "vitepress/theme";
import HomeLayout from "./HomeLayout.vue";
import ExamplesGrid from "./ExamplesGrid.vue";
import BrowserFrame from "./BrowserFrame.vue";
// Blueprint design system — mirrors framejs.app (see `framejs-css-sync` skill).
import "./blueprint.css";

export default {
  extends: DefaultTheme,
  Layout: HomeLayout,
  enhanceApp({ app }) {
    app.component("ExamplesGrid", ExamplesGrid);
    app.component("BrowserFrame", BrowserFrame);
  },
};
