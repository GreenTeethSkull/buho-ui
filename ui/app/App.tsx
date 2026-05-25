import { Page } from "@dynatrace/strato-components-preview/layouts";
import { ToastContainer } from "@dynatrace/strato-components-preview/notifications";
import React from "react";
import { Route, Routes } from "react-router-dom";
// import { Data } from "./pages/Data";
import { Header } from "./components/Header";
// import { Home } from "./pages/Home";
import { Chat } from "./pages/chat";
import { AppShellProvider } from "./hooks/useAppShell";

export const App = () => {
  return (
    <AppShellProvider>
      <style>{`
        main > div { padding: 0 !important; }
        main { padding: 0 !important; }
      `}</style>
      <Page>
        <Page.Header>
          <Header />
        </Page.Header>
        <Page.Main>
          <Routes>
            <Route path="/" element={<Chat />} />
            {/* <Route path="/" element={<Home />} /> */}
            {/* <Route path="/data" element={<Data />} /> */}
            {/* <Route path="/chat" element={<Chat />} /> */}
          </Routes>
        </Page.Main>
        <ToastContainer />
      </Page>
    </AppShellProvider>
  );
};
