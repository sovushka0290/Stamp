/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { Explorer } from "./pages/Explorer";
import { Clinic } from "./pages/Clinic";
import { PatientApp } from "./pages/PatientApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="explorer" element={<Explorer />} />
          <Route path="clinic" element={<Clinic />} />
          <Route
            path="patient"
            element={
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <h2 className="text-xl font-medium mb-2">
                  Patient App (TMA Sim)
                </h2>
                <p className="text-slate-500">
                  Scan a QR code from the Clinic MIS to begin.
                </p>
              </div>
            }
          />
          <Route path="patient/:sessionId" element={<PatientApp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
