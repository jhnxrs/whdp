import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { SignInPage } from "./pages/sign-in"
import { WithAuthentication } from "./components/WithAuthentication"
import { DashboardPage } from "./pages/dashboard"
import { AvoidAuthentication } from "@/components/AvoidAuthentication"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />

        <Route
          path="/sign-in"
          element={
            <AvoidAuthentication>
              <SignInPage />
            </AvoidAuthentication>
          }
        />

        <Route
          path="/dashboard"
          element={
            <WithAuthentication>
              <DashboardPage />
            </WithAuthentication>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
