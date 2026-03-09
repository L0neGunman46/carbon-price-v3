import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.

class Company(models.Model):
    name = models.CharField(max_length=255)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)
    
    
    def __str__(self):
        return f"{self.name} ({self.id})"
    


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("MEMBER" ,"Member"),
        ("ADMIN" ,"Admin"),
    )
    
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default="MEMBER"
    )