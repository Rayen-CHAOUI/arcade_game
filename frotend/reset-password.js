document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");
    const username = urlParams.get("username");
  
    document.getElementById("resetMessage").textContent = `Please reset your password for ${username} (${email}).`;
  
    document.getElementById("resetPasswordForm").addEventListener("submit", async (event) => {
      event.preventDefault();
  
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
  
      if (newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }
  
      // Send reset password request
      const response = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, newPassword })
      });
  
      const data = await response.json();
      if (data.success) {
        window.location.href = "login.html"; // Redirect to login page
      } else {
        alert("Failed to reset password.");
      }
    });
  });
  