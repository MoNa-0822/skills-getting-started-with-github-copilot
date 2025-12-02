document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: make a readable name and initials from an email/identifier
  function formatParticipant(text) {
    const raw = String(text || "");
    const local = raw.split("@")[0];
    const words = local.replace(/[\._\-]+/g, " ").split(" ").filter(Boolean);
    const name = words.map(w => w[0].toUpperCase() + w.slice(1)).join(" ") || raw;
    const initials = words.slice(0,2).map(w => w[0].toUpperCase()).join("") || raw.slice(0,2).toUpperCase();
    return { name, initials };
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHTML = "";
        if (details.participants && details.participants.length > 0) {
          const items = details.participants.map(p => {
            const { name: displayName, initials } = formatParticipant(p);
            return `
              <li class="participant-item">
                <span class="participant-badge">${initials}</span>
                <span class="participant-name">${displayName}</span>
                <button class="delete-btn" data-activity="${name}" data-email="${p}" title="Remove participant">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </li>
            `;
          }).join("");
          participantsHTML = `<ul class="participant-list">${items}</ul>`;
        } else {
          participantsHTML = `<p class="participants-empty">No participants yet — be the first!</p>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <h5>Participants</h5>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          const activity = btn.getAttribute("data-activity");
          const email = btn.getAttribute("data-email");

          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
              {
                method: "DELETE",
              }
            );

            const result = await response.json();

            if (response.ok) {
              // Refresh the activities list after successful deletion
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Failed to unregister participant";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");

              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            }
          } catch (error) {
            messageDiv.textContent = "Failed to unregister. Please try again.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
            console.error("Error unregistering:", error);

            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh the activities list after successful signup
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
