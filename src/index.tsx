/* @refresh reload */
import { render } from "solid-js/web";
import { HashRouter, Route } from "@solidjs/router";
import { lazy, type Component } from "solid-js";
import { Toaster } from "solid-toast";

import "./index.css";
import { Navbar } from "./Navbar";
import { Explore } from "./pages/explore/Explore";
import { Profile } from "./pages/profile/Profile";
import { Bundles } from "./pages/bundles/Bundles";
import { Home } from "./pages/home/Home";
import { ProjectEditor } from "./pages/project/ProjectEditor";
import { ProjectAssetsEditor } from "./pages/project/ProjectAssetsEditor";
import { ProjectManager } from "./pages/project/ProjectManager";

const TourEditor = lazy(async () => await import("./pages/project/TourEditor"));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

const Blank: Component = () => <></>;

const ExploreLayout: Component<{ children?: any }> = (props) => {
  return <>{props.children}</>;
};

render(
  () => (
    <>
      <HashRouter>
        <Route path="/" component={ExploreLayout}>
          <Route path="/" component={Explore} />
          <Route path="/profile" component={Profile} />
          <Route path="/bundles" component={Bundles} />
        </Route>
        <Route path="/admin" component={Navbar}>
          <Route path="/" component={Home} />
          <Route path="/projects/:pid" component={ProjectEditor}>
            <Route path="/" component={Blank} />
            <Route path="/assets" component={ProjectAssetsEditor} />
            <Route path="/manage" component={ProjectManager} />
            <Route path="/tours/:tid" component={TourEditor} />
          </Route>
        </Route>
      </HashRouter>
      <Toaster position="bottom-right" toastOptions={{ duration: 10000 }} />
    </>
  ),
  root!,
);
