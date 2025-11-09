document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityCardsContainer = document.getElementById("activity-cards");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", {
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-cache' // Ensure we get fresh data
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset select options to the placeholder option
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      // Clear right-hand activity cards (if container exists)
      if (activityCardsContainer) activityCardsContainer.innerHTML = "";

      // Track whether we added any participant cards
      let addedParticipantCards = 0;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // If activity has participants, add a participant card to the right sidebar
        if (Array.isArray(details.participants) && details.participants.length > 0 && activityCardsContainer) {
          const pCard = document.createElement("div");
          pCard.className = "participant-card";

          const participantsHtml = details.participants
            .map((p) => `
              <div class="participant-item">
                <span>${p}</span>
                <span class="delete-icon" title="Unregister participant" onclick="unregisterParticipant('${name}', '${p}')">✖</span>
              </div>`)
            .join("");

          pCard.innerHTML = `
            <h4>${name}</h4>
            <div class="participant-count"><strong>${details.participants.length}</strong> participant(s)</div>
            <div class="participant-list">${participantsHtml}</div>
          `;

          activityCardsContainer.appendChild(pCard);
          addedParticipantCards++;
        }
      });

      // If no participant cards were added, show friendly message
      if (activityCardsContainer && addedParticipantCards === 0) {
        activityCardsContainer.innerHTML = "<p>No participants registered yet.</p>";
      }
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      if (activityCardsContainer) activityCardsContainer.innerHTML = "<p>Failed to load participant activity cards.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      // Disable the submit button while processing
      const submitButton = signupForm.querySelector('button[type="submit"]');
      submitButton.disabled = true;

      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Ensure we refresh the activities list
        try {
          await fetchActivities();
        } catch (refreshError) {
          console.error("Error refreshing activities:", refreshError);
        }
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
    } finally {
      // Re-enable the submit button
      const submitButton = signupForm.querySelector('button[type="submit"]');
      submitButton.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});

// Function to unregister a participant from an activity
async function unregisterParticipant(activityName, email) {
  try {
    const response = await fetch(
      `/activities/${encodeURIComponent(activityName)}/unregister/${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (response.ok) {
      // Show success message
      const messageDiv = document.getElementById("message");
      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");

      // Refresh activities to update the participant list
      await fetchActivities();

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } else {
      throw new Error(result.detail || "Failed to unregister participant");
    }
  } catch (error) {
    console.error("Error unregistering participant:", error);
    const messageDiv = document.getElementById("message");
    messageDiv.textContent = error.message;
    messageDiv.className = "error";
    messageDiv.classList.remove("hidden");
  }
}
