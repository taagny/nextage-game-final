import { lazy } from "react"
import DeferredContent from "./components/DeferredContent"
import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Header from "./components/Header"
import Home from "./pages/Home"
const Runner = lazy(() => import("./pages/Runner"))

function App() {
  return (
    <Layout>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/runner" element={<DeferredContent><Runner /></DeferredContent>} />
      </Routes>
    </Layout>
  )
}

export default App
