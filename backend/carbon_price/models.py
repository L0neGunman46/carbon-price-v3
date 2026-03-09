from django.db import models
from django.conf import settings


# Create your models here.
class MarketForecast(models.Model):
    # for dummy and historical data
    source = models.CharField(max_length=50) # 'historical', 'analyst_bnef', 'analyst_refinitiv', 'analyst_internal'
    date = models.DateField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    


class CompanyAssumption(models.Model):
    # stores company price approved or requested by the memebers of the company
    STATUS_CHOICES  =(('PENDING', 'Pending Approval'), ('ACTIVE','Active'))
    company = models.ForeignKey('users.Company', on_delete=models.CASCADE)
    period = models.CharField(max_length=20) # e.g., '2026-Q1', '2027'
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='requests', on_delete=models.CASCADE)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='approvals', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('company', 'period', 'status')
    

class AuditLog(models.Model):
    # For audit logging the approval process
    company = models.ForeignKey('users.Company', on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50) 
    details = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
    