import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_root_redirect():
    """Test that root endpoint redirects to static/index.html"""
    response = client.get("/")
    assert response.status_code == 200 or response.status_code == 307
    assert "index.html" in response.url

def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    
    # Check if we have the expected activities
    assert "Chess Club" in activities
    assert "Programming Class" in activities
    assert "Gym Class" in activities
    
    # Check activity structure
    for activity_name, details in activities.items():
        assert "description" in details
        assert "schedule" in details
        assert "max_participants" in details
        assert "participants" in details
        assert isinstance(details["participants"], list)

def test_signup_success():
    """Test successful activity signup"""
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    
    # First ensure the student isn't already signed up
    response = client.get("/activities")
    activities = response.json()
    if email in activities[activity_name]["participants"]:
        pytest.skip("Test student already registered")
    
    # Try to sign up
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    assert "Signed up" in response.json()["message"]
    
    # Verify the student was added
    response = client.get("/activities")
    activities = response.json()
    assert email in activities[activity_name]["participants"]

def test_signup_duplicate():
    """Test signing up a student who is already registered"""
    activity_name = "Chess Club"
    # Use an email we know is registered
    email = "michael@mergington.edu"
    
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

def test_signup_nonexistent_activity():
    """Test signing up for a non-existent activity"""
    activity_name = "NonexistentClub"
    email = "student@mergington.edu"
    
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_unregister_success():
    """Test successful unregistration from activity"""
    activity_name = "Chess Club"
    email = "testunregister@mergington.edu"
    
    # First sign up the student
    client.post(f"/activities/{activity_name}/signup?email={email}")
    
    # Now try to unregister
    response = client.delete(f"/activities/{activity_name}/unregister/{email}")
    assert response.status_code == 200
    assert "Unregistered" in response.json()["message"]
    
    # Verify the student was removed
    response = client.get("/activities")
    activities = response.json()
    assert email not in activities[activity_name]["participants"]

def test_unregister_not_registered():
    """Test unregistering a student who isn't registered"""
    activity_name = "Chess Club"
    email = "notregistered@mergington.edu"
    
    response = client.delete(f"/activities/{activity_name}/unregister/{email}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_unregister_nonexistent_activity():
    """Test unregistering from a non-existent activity"""
    activity_name = "NonexistentClub"
    email = "student@mergington.edu"
    
    response = client.delete(f"/activities/{activity_name}/unregister/{email}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]