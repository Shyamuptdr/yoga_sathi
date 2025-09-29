from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('surya-namaskar/', views.surya_namaskar, name='surya_namaskar'),
    path('sudarshan-kriya/', views.sudarshan_kriya, name='sudarshan_kriya'), # <<< NEW URL
    path('trikonasana/', views.trikonasana, name='trikonasana'), # <<< NEW URL

    
    path('session/', views.session, name='session'),
    path('save_session/', views.save_session, name='save_session'),
    path('login/', views.user_login, name='login'), # <<< View name changed to user_login
    path('signup/', views.signup, name='signup'), 
    path('verify/<uuid:token>/', views.verify_email, name='verify_email'), # <<< NEW VERIFICATION PATH

]