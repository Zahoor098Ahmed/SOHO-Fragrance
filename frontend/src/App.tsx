import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StoreProvider } from "./store/store";
import { BrandStatsProvider } from "./context/BrandStatsContext";

export default function App() {
  return (
    <StoreProvider>
      <BrandStatsProvider>
        <RouterProvider router={router} />
      </BrandStatsProvider>
    </StoreProvider>
  );
}
