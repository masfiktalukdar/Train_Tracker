// All the imports
import { Routes, Route, Navigate } from "react-router-dom"
import Layout from "@features/admin/components/adminLayout"
import AdminDashboard from "@features/admin/pages/adminDashboard"
import AdminStations from "@features/admin/pages/adminStations"
import AdminTrains from "@features/admin/pages/adminTrains"


export default function App() {

  return (
    <>
      <Routes>
        <Route path="admin" element={<Layout/>} >
          <Route index element={<Navigate to="dashboard"/>}/>
          <Route path="dashboard" element={<AdminDashboard/>}/>
          <Route path="trains" element={<AdminTrains/>}/>
          <Route path="stations" element={<AdminStations/>}/>
        </Route>
      </Routes>
    </>
  )
}

