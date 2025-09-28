from django.contrib import admin
from .models import YogaSession

@admin.register(YogaSession)
class YogaSessionAdmin(admin.ModelAdmin):
    list_display = ('start_time', 'duration_seconds', 'posture_quality_percentage', 'total_frames', 'bad_frames')
    list_filter = ('start_time',)
    search_fields = ('start_time',)
    readonly_fields = ('start_time', 'duration_seconds', 'total_frames', 'bad_frames')

    # Disable adding sessions from the admin
    def has_add_permission(self, request):
        return False 
    
    # Disable editing sessions from the admin
    def has_change_permission(self, request, obj=None):
        return False 