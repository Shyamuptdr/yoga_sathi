from django.db import models

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