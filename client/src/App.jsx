// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useContext } from 'react';
// import Navbar from './components/Navbar';
// import Landing from './pages/Landing';
// import Feedback from './pages/Feedback';
// import Dashboard from './pages/Dashboard';
// import About from './pages/About';
// import Results from './pages/Results';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import UploadDataset from './pages/UploadDataset';
// import Amazon from './pages/Amazon';
// import Zomato from './pages/Zomato';
// import Flipkart from './pages/Flipkart';
// import { Toaster } from 'react-hot-toast';
// import { AuthProvider, AuthContext } from './context/AuthContext';

// const ProtectedRoute = ({ children }) => {
//   const { user } = useContext(AuthContext);
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// };

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <div className="min-h-screen flex flex-col">
//           <Navbar />
//           <main className="flex-grow pt-16">
//             <Routes>
//               <Route path="/" element={<Landing />} />
//               <Route path="/feedback" element={<Feedback />} />
//               <Route path="/about" element={<About />} />
//               <Route path="/results" element={<Results />} />
//               <Route path="/login" element={<Login />} />
//               <Route path="/register" element={<Register />} />
//               <Route path="/upload" element={<UploadDataset />} />
//               <Route path="/amazon" element={<Amazon />} />
//               <Route path="/zomato" element={<Zomato />} />
//               <Route path="/flipkart" element={<Flipkart />} />
//               <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//             </Routes>
//           </main>
//           <Toaster position="bottom-right" />
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;
