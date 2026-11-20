import React, { useEffect } from 'react';

import '../styles/profile.css';
import null_avatar from '../assets/null_avatar.png';
import { api } from '../api/client.js';

export default function ProfilePage() {
  useEffect(() => {
    api.ping()
      .then((data) => console.log(data))
      .catch((err) => console.error('Ошибка ping:', err));
  }, []);

  return (
    <section id="profile">
      <div className="profile_AvatarBlock">
        <img src={null_avatar} alt="#" />

        <h2>
          <br /> NICKNAME
        </h2>

        <button>sign from GitHub</button>
      </div>
      <div className="profile_Info">
        <h2>Тут будет всякая статистика</h2>
      </div>
    </section>
  );
}
