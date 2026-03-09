"""
URL configuration for cbamboo project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from carbon_price import views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('carbon-price/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('carbon-price/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('carbon-price/users/me/', views.get_me),

    # Data & Settings
    path('carbon-price/market-data/', views.get_market_data),
    path('carbon-price/assumptions/', views.company_assumptions_view),
    path('carbon-price/assumptions/active-prices/', views.get_active_company_prices),
    path('carbon-price/assumptions/<int:assumption_id>/review/', views.review_assumption),
    path('carbon-price/audit-logs/', views.get_audit_logs),
]