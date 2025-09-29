import json
from django.shortcuts import render, redirect 
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# --- AUTH IMPORTS ---
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login, logout, authenticate
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.urls import reverse
from django.contrib.auth.models import User
from .models import YogaSession, VerificationToken # <<< Updated imports

# --- HELPER FUNCTION ---
def send_verification_email(user, token):
    # This URL is used to construct the verification link. 
    # In a real environment, replace this with your domain name (e.g., settings.BASE_URL)
    current_site = 'http://127.0.0.1:8000' 
    verify_url = reverse('verify_email', kwargs={'token': token.token})
    link = f"{current_site}{verify_url}"

    subject = 'Activate Your Yoga Sathi Account'
    message = render_to_string('yogasathi/verification_email.txt', {
        'user': user,
        'link': link,
    })
    
    # Note: Email configuration must be set up in config/settings.py
    send_mail(subject, message, 'support@yogasathi.com', [user.email])

# --- VIEW FUNCTIONS ---

def signup(request):
    if request.method == 'POST':
        # Ensure that UserCreationForm has access to email if a custom one is used, 
        # or use a default form and set email separately.
        form = UserCreationForm(request.POST) 
        if form.is_valid():
            # 1. Save user but set to inactive
            user = form.save(commit=False)
            user.is_active = False 
            # Note: UserCreationForm does not include email by default; 
            # you need a custom form or must ensure the email is handled correctly.
            # Assuming for this demo, the form fields cover username/password.
            user.save()
            
            # 2. Create verification token and send email
            token = VerificationToken.objects.create(user=user)
            send_verification_email(user, token)
            
            # 3. Redirect to completion message
            return render(request, 'yogasathi/signup_complete.html', {'message': 'Please check your email to complete registration.'})
    else:
        form = UserCreationForm()
        
    return render(request, 'yogasathi/signup.html', {'form': form})


def user_login(request): # Renamed 'login' to 'user_login' to avoid utility name collision
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return redirect('home')
                else:
                    # Login blocked: User exists but is not verified
                    return render(request, 'yogasathi/login.html', {'form': form, 'error': 'Account not verified. Please check your email for the verification link.'})
            else:
                # Invalid credentials
                return render(request, 'yogasathi/login.html', {'form': form, 'error': 'Invalid username or password.'})
        
    else:
        form = AuthenticationForm()
        
    return render(request, 'yogasathi/login.html', {'form': form})


def verify_email(request, token): # <<< NEW FUNCTION to verify the token
    try:
        verification_token = VerificationToken.objects.get(token=token)
        user = verification_token.user
    except VerificationToken.DoesNotExist:
        return HttpResponse('Invalid verification link.', status=400)
    
    if user.is_active:
        return HttpResponse('Account already verified. You may log in.', status=200)

    # Activate the user
    user.is_active = True
    user.save()
    
    # Delete the used token
    verification_token.delete()
    
    # Redirect to a success page
    return render(request, 'yogasathi/verification_success.html', {'message': 'Your account has been successfully verified! You can now log in.'})

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

def sudarshan_kriya(request): # <<< NEW VIEW
    return render(request, 'yogasathi/sudarshan_kriya.html')

def trikonasana(request): # <<< NEW VIEW
    return render(request, 'yogasathi/trikonasana.html')



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