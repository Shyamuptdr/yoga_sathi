# yogasathi/models.py
from django.db import models
from django.contrib.auth.models import User # Standard Django User model
import uuid # For generating unique tokens

class YogaSession(models.Model):
    """Stores data for a single yoga session."""
    duration_seconds = models.PositiveIntegerField()
    total_frames = models.PositiveIntegerField()
    bad_frames = models.PositiveIntegerField()
    start_time = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Session on {self.start_time.strftime('%Y-%m-%d %H:%M')}"

    @property
    def posture_quality_percentage(self):
        if self.total_frames == 0:
            return 0
        good_frames = self.total_frames - self.bad_frames
        return round((good_frames / self.total_frames) * 100, 2)

class VerificationToken(models.Model): # <<< NEW MODEL
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Token for {self.user.username}"