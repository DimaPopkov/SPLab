import { useState } from 'react'
import { Outlet } from 'react-router-dom';

import Header from './Header.jsx';

import '../styles/index.css'

function App() {
    return (
    <>
        <Header />

        <main id="content">
            <Outlet />
        </ main>
    </>
    )
}

export default App