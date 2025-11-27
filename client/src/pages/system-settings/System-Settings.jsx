import { React, useState } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "../../context/auth/AuthContext";
import { useNavigate } from 'react-router-dom';

import LoadingScreen from '../../components/Loading/LoadingScreen'
import Header from '../../components/Header/Header'
import Sidebar from '../../components/Sidebar/Sidebar'
import Hero from '../../components/Hero/Hero'
import SystemSettingsComponent from '../../components/SystemSettingsComponent/SystemSettings'

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const role = user?.roles[0].name;

  console.log(role);
  

  return (
    <div class="bg-gray-100 font-sans">
       <Helmet>
          <title>HRMIS - System Settings</title>
        </Helmet>

        <input type="checkbox" id="menu-toggle" class="hidden" />

        <div className="flex flex-col h-screen" id="app-container">
            <Header logout={logout} user={user}/>

            <main className="flex flex-1 overflow-hidden">
                <Sidebar user = {user} role = {role}/>
                <section className="flex-1 p-6 space-y-6 overflow-y-auto">
                  <Hero user = {user} />
                  <SystemSettingsComponent />
                </section>
            </main>
        </div>
    </div>
  )
}

export default Dashboard