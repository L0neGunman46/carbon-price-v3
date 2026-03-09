from rest_framework import serializers
from .models import MarketForecast, CompanyAssumption, AuditLog
from users.models import CustomUser

class MarketDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketForecast
        fields = ['source', 'date', 'price']

class CompanyAssumptionSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)

    class Meta:
        model = CompanyAssumption
        fields = ['id', 'period', 'price', 'status', 'requested_by_name', 'approved_by_name', 'created_at']

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'username', 'action', 'details', 'timestamp']