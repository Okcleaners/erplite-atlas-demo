import React from "react";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import App from "./App.jsx";
import { PublicPage } from "./PublicPages.jsx";

export const renderHome = () => renderToString(<App />);
export const renderPage = (page) => renderToStaticMarkup(<PublicPage page={page} />);
