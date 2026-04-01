const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Requirement 13: Success! Store the token and redirect
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        alert(`Welcome back, ${data.user.name}!`);
        // Here you would use navigate('/home') from react-router-dom
      } else {
        // Defensive Programming: Show the error message from your backend
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Could not connect to the server.');
    }
  };