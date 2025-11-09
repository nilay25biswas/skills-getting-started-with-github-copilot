document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const activityCardsContainer = document.getElementById("activity-cards");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
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
            .map((p) => `<div class="participant-item">${p}</div>`)
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
        // Refresh activities so participant panel updates immediately
        await fetchActivities();
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
