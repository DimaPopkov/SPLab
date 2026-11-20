import React from 'react';

import '../styles/profile.css';

import null_avatar from '../assets/null_avatar.png'

export default function ProfilePage() {
    fetch("http://127.0.0.1:8000/api/ping")
    .then((res) => res.json())
    .then((data) => console.log(data));

    return (
        <section id="profile">
            <div className='profile_AvatarBlock'>
                <img src={null_avatar} alt="#"/>
                
                <h2>
                   <br /> NICKNAME
                </ h2>

                <button>
                    sign from GitHub
                </ button>
            </ div>
            <div className='profile_Info'>
                <h2>
                    Тут будет всякая статистика
                </h2>
            </ div>
        </ section>
    );
}