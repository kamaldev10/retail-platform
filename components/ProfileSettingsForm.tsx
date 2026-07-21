import React, { useState } from 'react';

export default function ProfileSettingsForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [notification, setNotification] = useState(false);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!name) {
      alert('Please fill in your name');
      return;
    }
    if (!email) {
      alert('Please fill in your email');
      return;
    }
    alert('Profile saved successfully!');
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h2>User Profile Settings</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <p>Name</p>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Enter name" 
          />
        </div>
        <div>
          <p>Email</p>
          <input 
            type="text" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Enter email" 
          />
        </div>
        <div>
          <p>Bio</p>
          <textarea 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            placeholder="Enter bio" 
          />
        </div>
        <div>
          <input 
            type="checkbox" 
            checked={notification} 
            onChange={(e) => setNotification(e.target.checked)} 
          />
          <span>Enable email notifications</span>
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  );
}
