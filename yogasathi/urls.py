from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('surya-namaskar/', views.surya_namaskar, name='surya_namaskar'),
    path('session/', views.session, name='session'),
    path('save_session/', views.save_session, name='save_session'),
]