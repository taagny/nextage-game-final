import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Header from "./components/Header"
import Home from "./pages/Home"
import Runner from "./pages/Runner"
import PremiumSuccess from "./pages/PremiumSuccess"

function App() {
  return (
    <Layout>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/runner" element={<Runner />} />
        <Route path="/premium-success" element={<PremiumSuccess />} />
      </Routes>
    </Layout>
  )
}

export default App