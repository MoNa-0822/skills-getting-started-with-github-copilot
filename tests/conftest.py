import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add src directory to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from app import app, activities


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def reset_activities():
    """Reset activities to initial state before each test"""
    # Store original state
    original = {k: {"participants": v["participants"].copy()} for k, v in activities.items()}
    
    yield
    
    # Restore original state after test
    for activity_name, data in original.items():
        activities[activity_name]["participants"] = data["participants"]
