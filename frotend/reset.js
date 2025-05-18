document.getElementById("resetForm").addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
  
    // Send data to the server for validation
    const response = await fetch("http://localhost:5000/reset-password-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username })
    });
  
    const data = await response.json();
    if (data.success) {
      // Redirect to the reset-password page
      window.location.href = `reset-password.html?email=${email}&username=${username}`;
    } else {
      alert("Failed to reset password, please check your details.");
    }
  });
  