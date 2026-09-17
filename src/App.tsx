import { Route, Routes } from "react-router-dom";
import EditorPage from "./pages/EditorPage";
import ListPage from "./pages/ListPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ListPage />} />
      <Route path="/new" element={<EditorPage />} />
      <Route path="/entry/:id" element={<EditorPage />} />
    </Routes>
  );
}
