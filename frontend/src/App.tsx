import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StoreProvider } from "./store/store";

export default function App() {
  return (
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  );
}
