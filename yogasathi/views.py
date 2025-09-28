import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import YogaSession

def home(request):
    return render(request, 'yogasathi/home.html')

def session(request):
    return render(request, 'yogasathi/home.html')

def about(request):
    return render(request, 'yogasathi/about.html')

def contact(request):
    return render(request, 'yogasathi/contact.html')

def surya_namaskar(request):
    return render(request, 'yogasathi/surya_namaskar.html')

@csrf_exempt 
def save_session(request):
    """Saves yoga session data sent from the frontend."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            duration = data.get('duration')
            total_frames = data.get('totalFrames')
            bad_frames = data.get('badFrames')

            if duration is None or total_frames is None or bad_frames is None:
                return JsonResponse({'status': 'error', 'message': 'Missing data'}, status=400)

            session = YogaSession.objects.create(
                duration_seconds=duration,
                total_frames=total_frames,
                bad_frames=bad_frames
            )
            session.save()
            
            return JsonResponse({'status': 'success', 'message': 'Session saved successfully!'})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'}, status=405)